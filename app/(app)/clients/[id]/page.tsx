import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientFormDialog } from "../client-form-dialog";
import { DeleteClientButton } from "../delete-client-button";
import { updateClient } from "../actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {client.name}
          </h1>
          {client.company && (
            <p className="text-sm text-muted-foreground">{client.company}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ClientFormDialog
            action={updateClient.bind(null, client.id)}
            title="Edit client"
            submitLabel="Save changes"
            defaultValues={client}
            trigger={<Button variant="outline">Edit</Button>}
          />
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{client.email ?? "—"}</dd>
        <dt className="text-muted-foreground">Notes</dt>
        <dd>{client.notes ?? "—"}</dd>
      </dl>

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-medium">Projects</h2>
        {client.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects for this client yet.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {client.projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:underline"
                >
                  {project.name}
                </Link>
                {project.status === "ARCHIVED" && (
                  <Badge variant="secondary" className="ml-2">
                    Archived
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
