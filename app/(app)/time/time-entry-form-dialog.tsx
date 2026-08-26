"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toDatetimeLocalValue } from "@/lib/format";
import type { TimeEntryFormState } from "./actions";

type TimeEntryFormDialogProps = {
  action: (
    state: TimeEntryFormState,
    formData: FormData
  ) => Promise<TimeEntryFormState>;
  trigger: ReactNode;
  title: string;
  submitLabel: string;
  projects: { id: string; name: string }[];
  fixedProjectId?: string;
  defaultValues?: {
    description?: string | null;
    projectId?: string;
    startedAt?: Date;
    endedAt?: Date;
  };
};

export function TimeEntryFormDialog({
  action,
  trigger,
  title,
  submitLabel,
  projects,
  fixedProjectId,
  defaultValues,
}: TimeEntryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    TimeEntryFormState,
    FormData
  >(action, undefined);

  const [startedAt, setStartedAt] = useState(() =>
    toDatetimeLocalValue(defaultValues?.startedAt ?? new Date())
  );
  const [endedAt, setEndedAt] = useState(() =>
    toDatetimeLocalValue(defaultValues?.endedAt ?? new Date())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {fixedProjectId ? (
            <input type="hidden" name="projectId" value={fixedProjectId} />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project</Label>
              <Select
                name="projectId"
                defaultValue={defaultValues?.projectId}
                items={Object.fromEntries(
                  projects.map((project) => [project.id, project.name])
                )}
              >
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={defaultValues?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startedAtLocal">Start</Label>
              <Input
                id="startedAtLocal"
                type="datetime-local"
                step={1}
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endedAtLocal">End</Label>
              <Input
                id="endedAtLocal"
                type="datetime-local"
                step={1}
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
          </div>
          <input
            type="hidden"
            name="startedAt"
            value={startedAt ? new Date(startedAt).toISOString() : ""}
          />
          <input
            type="hidden"
            name="endedAt"
            value={endedAt ? new Date(endedAt).toISOString() : ""}
          />
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
