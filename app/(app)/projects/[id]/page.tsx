import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectFormDialog } from "../project-form-dialog";
import { DeleteProjectButton } from "../delete-project-button";
import { updateProject } from "../actions";
import { Timer } from "./timer";
import { TimeEntriesTable } from "../../time/time-entries-table";
import { TimeEntryFormDialog } from "../../time/time-entry-form-dialog";
import { createTimeEntry } from "../../time/actions";
import { PaymentsList } from "../../payments/payments-list";
import { PaymentFormDialog } from "../../payments/payment-form-dialog";
import { createPayment } from "../../payments/actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const [project, clients, runningEntry, entries, payments] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, endedAt: null },
      select: { id: true, projectId: true, startedAt: true, description: true },
    }),
    prisma.timeEntry.findMany({
      where: { projectId: id, userId },
      orderBy: { startedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { projectId: id, userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/clients/${project.client.id}`}
              className="hover:underline"
            >
              {project.client.name}
            </Link>
          </p>
          <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
            {project.status === "ACTIVE" ? "Active" : "Archived"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <ProjectFormDialog
            action={updateProject.bind(null, project.id)}
            title="Edit project"
            submitLabel="Save changes"
            clients={clients}
            defaultValues={{
              name: project.name,
              clientId: project.clientId,
              status: project.status,
            }}
            trigger={<Button variant="outline">Edit</Button>}
          />
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <Timer
            projectId={project.id}
            runningEntry={
              runningEntry
                ? {
                    id: runningEntry.id,
                    projectId: runningEntry.projectId,
                    startedAt: runningEntry.startedAt.toISOString(),
                    description: runningEntry.description,
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Time entries</h2>
          <TimeEntryFormDialog
            action={createTimeEntry}
            title="Log time"
            submitLabel="Add entry"
            projects={clients.length > 0 ? [{ id: project.id, name: project.name }] : []}
            fixedProjectId={project.id}
            trigger={
              <Button variant="outline" size="sm">
                Log time
              </Button>
            }
          />
        </div>
        <TimeEntriesTable
          entries={entries}
          projects={[{ id: project.id, name: project.name }]}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Payments</h2>
          <PaymentFormDialog
            action={createPayment}
            projectId={project.id}
            title="New payment"
            submitLabel="Add payment"
            trigger={
              <Button variant="outline" size="sm">
                New payment
              </Button>
            }
          />
        </div>
        <PaymentsList projectId={project.id} payments={payments} />
      </div>
    </div>
  );
}
