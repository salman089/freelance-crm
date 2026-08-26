import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [clients, projects, timeEntries, payments] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      select: { name: true, email: true, company: true, notes: true },
    }),
    prisma.project.findMany({
      where: { userId },
      select: {
        name: true,
        status: true,
        client: { select: { name: true, email: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: { userId, endedAt: { not: null } },
      select: {
        description: true,
        startedAt: true,
        endedAt: true,
        project: {
          select: {
            name: true,
            client: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      select: {
        amount: true,
        currency: true,
        status: true,
        note: true,
        dueDate: true,
        project: {
          select: {
            name: true,
            client: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  const body = JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      clients,
      projects,
      timeEntries,
      payments,
    },
    null,
    2
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="workbase-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
