import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientFormDialog } from "./client-form-dialog";
import { createClient } from "./actions";

export default async function ClientsPage() {
  const userId = await requireUserId();
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and their projects.
          </p>
        </div>
        <ClientFormDialog
          action={createClient}
          title="New client"
          submitLabel="Create client"
          trigger={<Button>New client</Button>}
        />
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clients yet. Add your first one to get started.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card>
                  <CardContent className="space-y-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.company ?? "No company"}
                    </p>
                    {client.email && (
                      <p className="text-sm text-muted-foreground">
                        {client.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.company ?? "—"}</TableCell>
                  <TableCell>{client.email ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
