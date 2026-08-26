"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
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
import { formatDuration } from "@/lib/format";
import { startTimer, stopTimer, type StartTimerState } from "../../time/actions";

type RunningEntry = {
  id: string;
  projectId: string;
  startedAt: string;
  description: string | null;
};

export function Timer({
  projectId,
  runningEntry,
}: {
  projectId: string;
  runningEntry: RunningEntry | null;
}) {
  const [isPending, startTransition] = useTransition();
  const isRunningHere = runningEntry?.projectId === projectId;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunningHere) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunningHere]);

  if (isRunningHere && runningEntry) {
    const elapsed = now - new Date(runningEntry.startedAt).getTime();
    return (
      <div className="flex items-center gap-4">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
        </span>
        <div>
          <p className="font-mono text-lg tabular-nums">
            {formatDuration(elapsed)}
          </p>
          {runningEntry.description && (
            <p className="text-sm text-muted-foreground">
              {runningEntry.description}
            </p>
          )}
        </div>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              stopTimer(runningEntry.id);
            })
          }
        >
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {runningEntry && (
        <span className="text-sm text-muted-foreground">
          A timer is running on another project.
        </span>
      )}
      <StartTimerDialog projectId={projectId} otherRunning={Boolean(runningEntry)} />
    </div>
  );
}

function StartTimerDialog({
  projectId,
  otherRunning,
}: {
  projectId: string;
  otherRunning: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    StartTimerState,
    FormData
  >(startTimer, undefined);

  useEffect(() => {
    if (!pending && !state?.error && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        {otherRunning ? "Start here instead" : "Start timer"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What are you working on?</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-1.5">
            <Label htmlFor="description" className="sr-only">
              Task
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Homepage wireframes"
              autoFocus
              required
            />
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Starting…" : "Start timer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
