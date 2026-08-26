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
import type { ProjectFormState } from "./actions";

type ProjectFormDialogProps = {
  action: (
    state: ProjectFormState,
    formData: FormData
  ) => Promise<ProjectFormState>;
  trigger: ReactNode;
  title: string;
  submitLabel: string;
  clients: { id: string; name: string }[];
  defaultValues?: {
    name?: string;
    clientId?: string;
    status?: string;
  };
};

export function ProjectFormDialog({
  action,
  trigger,
  title,
  submitLabel,
  clients,
  defaultValues,
}: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(action, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultValues?.name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Client</Label>
            <Select
              name="clientId"
              defaultValue={defaultValues?.clientId}
              items={Object.fromEntries(
                clients.map((client) => [client.id, client.name])
              )}
            >
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {defaultValues && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                defaultValue={defaultValues?.status ?? "ACTIVE"}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
