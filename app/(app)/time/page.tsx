import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimeEntryFormDialog } from "./time-entry-form-dialog";
import { TimeEntriesTable } from "./time-entries-table";
import { createTimeEntry, stopTimer } from "./actions";

export default async function TimePage() {
  const userId = await requireUserId();

  const [entries, projects, runningEntry] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, endedAt: null },
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Time
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your hours and monitor project progress.
          </p>
        </div>
        <TimeEntryFormDialog
          action={createTimeEntry}
          title="Log time"
          submitLabel="Add entry"
          projects={projects}
          trigger={<Button disabled={projects.length === 0}>Log time</Button>}
        />
      </div>

      {runningEntry && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
              </span>
              <p className="text-sm">
                Timer running on{" "}
                <Link
                  href={`/projects/${runningEntry.project.id}`}
                  className="font-medium hover:underline"
                >
                  {runningEntry.project.name}
                </Link>
                {runningEntry.description
                  ? ` — ${runningEntry.description}`
                  : ""}
              </p>
            </div>
            <form action={stopTimer.bind(null, runningEntry.id)}>
              <Button type="submit" variant="destructive" size="sm">
                Stop
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <TimeEntriesTable entries={entries} projects={projects} showProject />
    </div>
  );
}
