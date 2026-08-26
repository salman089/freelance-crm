import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { startOfWeek } from "@/lib/date";
import { stopTimer } from "../time/actions";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const [activeProjectCount, weekEntries, recentEntries, runningEntry, outstanding] =
    await Promise.all([
      prisma.project.count({ where: { userId, status: "ACTIVE" } }),
      prisma.timeEntry.findMany({
        where: {
          userId,
          endedAt: { not: null },
          startedAt: { gte: startOfWeek(new Date()) },
        },
        select: { startedAt: true, endedAt: true },
      }),
      prisma.timeEntry.findMany({
        where: { userId, endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.timeEntry.findFirst({
        where: { userId, endedAt: null },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: { userId, status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

  const weekTotalMs = weekEntries.reduce(
    (sum, entry) => sum + (entry.endedAt!.getTime() - entry.startedAt.getTime()),
    0
  );

  const outstandingLabel =
    outstanding.length === 0
      ? formatMoney(0, "USD")
      : outstanding
          .map((row) => formatMoney(row._sum.amount ?? 0, row.currency))
          .join(" + ");

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Active projects" value={String(activeProjectCount)} />
        <StatTile label="Hours this week" value={formatDuration(weekTotalMs)} />
        <StatTile label="Outstanding" value={outstandingLabel} />
      </div>

      <Card>
        <CardContent className="flex items-center justify-between">
          {runningEntry ? (
            <>
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
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No timer running.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Recent activity
        </h2>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        ) : (
          <Card size="sm">
            <CardContent className="divide-y divide-border p-0">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    <Link
                      href={`/projects/${entry.project.id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                    {entry.description ? ` — ${entry.description}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDuration(
                      entry.endedAt!.getTime() - entry.startedAt.getTime()
                    )}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-1.5">
        <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-heading text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
