import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";
import { TimeEntryFormDialog } from "./time-entry-form-dialog";
import { DeleteTimeEntryButton } from "./delete-time-entry-button";
import { updateTimeEntry } from "./actions";

type Entry = {
  id: string;
  description: string | null;
  startedAt: Date;
  endedAt: Date | null;
  projectId: string;
  project?: { id: string; name: string };
};

export function TimeEntriesTable({
  entries,
  projects,
  showProject = false,
}: {
  entries: Entry[];
  projects: { id: string; name: string }[];
  showProject?: boolean;
}) {
  const completed = entries.filter((entry) => entry.endedAt);

  if (completed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No time entries yet.</p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {completed.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {showProject && entry.project && (
                    <Link
                      href={`/projects/${entry.project.id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {entry.description ?? "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.startedAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-medium">
                  {formatDuration(
                    entry.endedAt!.getTime() - entry.startedAt.getTime()
                  )}
                </span>
              </div>
              <div className="flex justify-end gap-1">
                <TimeEntryFormDialog
                  action={updateTimeEntry.bind(null, entry.id)}
                  title="Edit time entry"
                  submitLabel="Save changes"
                  projects={projects}
                  fixedProjectId={showProject ? undefined : entry.projectId}
                  defaultValues={{
                    description: entry.description,
                    projectId: entry.projectId,
                    startedAt: entry.startedAt,
                    endedAt: entry.endedAt ?? undefined,
                  }}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                <DeleteTimeEntryButton entryId={entry.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {completed.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.startedAt.toLocaleDateString()}</TableCell>
              {showProject && (
                <TableCell>
                  {entry.project ? (
                    <Link
                      href={`/projects/${entry.project.id}`}
                      className="hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              <TableCell>{entry.description ?? "—"}</TableCell>
              <TableCell>
                {formatDuration(
                  entry.endedAt!.getTime() - entry.startedAt.getTime()
                )}
              </TableCell>
              <TableCell className="flex justify-end gap-1">
                <TimeEntryFormDialog
                  action={updateTimeEntry.bind(null, entry.id)}
                  title="Edit time entry"
                  submitLabel="Save changes"
                  projects={projects}
                  fixedProjectId={showProject ? undefined : entry.projectId}
                  defaultValues={{
                    description: entry.description,
                    projectId: entry.projectId,
                    startedAt: entry.startedAt,
                    endedAt: entry.endedAt ?? undefined,
                  }}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                <DeleteTimeEntryButton entryId={entry.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
