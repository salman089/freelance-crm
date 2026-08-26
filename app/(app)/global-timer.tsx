"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { stopTimer } from "./time/actions";

type RunningEntry = {
  id: string;
  projectId: string;
  projectName: string;
  startedAt: string;
  description: string | null;
};

export function GlobalTimer({
  runningEntry,
  className,
}: {
  runningEntry: RunningEntry | null;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!runningEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [runningEntry]);

  const elapsed = runningEntry
    ? now - new Date(runningEntry.startedAt).getTime()
    : 0;

  return (
    <AnimatePresence>
      {runningEntry && (
        <motion.div
          key={runningEntry.id}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className={
            "flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2 " +
            (className ?? "")
          }
        >
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
          </span>
          <Link
            href={`/projects/${runningEntry.projectId}`}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-xs font-medium">
              {runningEntry.projectName}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {formatDuration(elapsed)}
              {runningEntry.description ? ` · ${runningEntry.description}` : ""}
            </p>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isPending}
            aria-label="Stop timer"
            onClick={() =>
              startTransition(() => {
                stopTimer(runningEntry.id);
              })
            }
          >
            <span className="block size-2.5 rounded-[2px] bg-current" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
