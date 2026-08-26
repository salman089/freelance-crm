import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectFormDialog } from "./project-form-dialog";
import { createProject } from "./actions";

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your active engagements and track progress.
          </p>
        </div>
        <ProjectFormDialog
          action={createProject}
          title="New project"
          submitLabel="Create project"
          clients={clients}
          trigger={<Button disabled={clients.length === 0}>New project</Button>}
        />
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a client first before creating a project.
        </p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet. Add your first one to get started.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.client.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {project.status === "ACTIVE" ? "Active" : "Archived"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>{project.client.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        project.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {project.status === "ACTIVE" ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
