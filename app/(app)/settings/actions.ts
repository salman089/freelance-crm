"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type SettingsFormState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const name = (formData.get("name") as string | null)?.trim();

  await prisma.user.update({
    where: { id: userId },
    data: { name: name || null },
  });

  revalidatePath("/settings", "layout");
  return { success: "Profile updated." };
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

type ExportShape = {
  version: number;
  clients: {
    name: string;
    email?: string | null;
    company?: string | null;
    notes?: string | null;
  }[];
  projects: {
    name: string;
    status?: string;
    client: { name: string; email?: string | null };
  }[];
  timeEntries: {
    description?: string | null;
    startedAt: string;
    endedAt: string;
    project: { name: string; client: { name: string; email?: string | null } };
  }[];
  payments?: {
    amount: number;
    currency: string;
    status?: string;
    note?: string | null;
    dueDate?: string | null;
    project: { name: string; client: { name: string; email?: string | null } };
  }[];
};

function isValidExport(data: unknown): data is ExportShape {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.clients) &&
    Array.isArray(d.projects) &&
    Array.isArray(d.timeEntries) &&
    (d.payments === undefined || Array.isArray(d.payments))
  );
}

export async function importData(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a JSON file to import." };
  }

  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { error: "That file isn't valid JSON." };
  }

  if (!isValidExport(data)) {
    return { error: "That file doesn't match the expected export format." };
  }

  const existingClients = await prisma.client.findMany({ where: { userId } });
  const clientKey = (name: string, email?: string | null) =>
    `${normalize(name)}|${normalize(email)}`;
  const clientMap = new Map(
    existingClients.map((c) => [clientKey(c.name, c.email), c.id])
  );

  let importedClients = 0;
  let importedProjects = 0;
  let importedEntries = 0;
  let importedPayments = 0;

  await prisma.$transaction(async (tx) => {
    for (const client of data.clients) {
      const key = clientKey(client.name, client.email);
      if (clientMap.has(key)) continue;
      const created = await tx.client.create({
        data: {
          userId,
          name: client.name,
          email: client.email || null,
          company: client.company || null,
          notes: client.notes || null,
        },
      });
      clientMap.set(key, created.id);
      importedClients++;
    }

    const existingProjects = await tx.project.findMany({ where: { userId } });
    const projectKey = (name: string, clientId: string) =>
      `${normalize(name)}|${clientId}`;
    const projectMap = new Map(
      existingProjects.map((p) => [projectKey(p.name, p.clientId), p.id])
    );

    for (const project of data.projects) {
      const clientId = clientMap.get(
        clientKey(project.client.name, project.client.email)
      );
      if (!clientId) continue;
      const key = projectKey(project.name, clientId);
      if (projectMap.has(key)) continue;
      const created = await tx.project.create({
        data: {
          userId,
          clientId,
          name: project.name,
          status: project.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
        },
      });
      projectMap.set(key, created.id);
      importedProjects++;
    }

    const existingEntries = await tx.timeEntry.findMany({ where: { userId } });
    const entryKey = (
      projectId: string,
      startedAt: string,
      endedAt: string
    ) => `${projectId}|${startedAt}|${endedAt}`;
    const entrySet = new Set(
      existingEntries.map((e) =>
        entryKey(e.projectId, e.startedAt.toISOString(), e.endedAt?.toISOString() ?? "")
      )
    );

    for (const entry of data.timeEntries) {
      const clientId = clientMap.get(
        clientKey(entry.project.client.name, entry.project.client.email)
      );
      if (!clientId) continue;
      const projectId = projectMap.get(projectKey(entry.project.name, clientId));
      if (!projectId) continue;

      const startedAt = new Date(entry.startedAt);
      const endedAt = new Date(entry.endedAt);
      if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime()))
        continue;

      const key = entryKey(projectId, startedAt.toISOString(), endedAt.toISOString());
      if (entrySet.has(key)) continue;

      await tx.timeEntry.create({
        data: {
          userId,
          projectId,
          description: entry.description || null,
          startedAt,
          endedAt,
        },
      });
      entrySet.add(key);
      importedEntries++;
    }

    const existingPayments = await tx.payment.findMany({ where: { userId } });
    const paymentKey = (
      projectId: string,
      amount: number,
      currency: string,
      note: string,
      dueDate: string
    ) => `${projectId}|${amount}|${currency}|${note}|${dueDate}`;
    const paymentSet = new Set(
      existingPayments.map((p) =>
        paymentKey(
          p.projectId,
          p.amount,
          p.currency,
          p.note ?? "",
          p.dueDate?.toISOString() ?? ""
        )
      )
    );

    for (const payment of data.payments ?? []) {
      const clientId = clientMap.get(
        clientKey(payment.project.client.name, payment.project.client.email)
      );
      if (!clientId) continue;
      const projectId = projectMap.get(projectKey(payment.project.name, clientId));
      if (!projectId) continue;

      const note = payment.note ?? "";
      const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
      const dueDateIso =
        dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : "";

      const key = paymentKey(projectId, payment.amount, payment.currency, note, dueDateIso);
      if (paymentSet.has(key)) continue;

      await tx.payment.create({
        data: {
          userId,
          projectId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status === "PAID" ? "PAID" : "PENDING",
          note: note || null,
          dueDate: dueDateIso ? dueDate : null,
        },
      });
      paymentSet.add(key);
      importedPayments++;
    }
  });

  revalidatePath("/", "layout");
  return {
    success: `Imported ${importedClients} client(s), ${importedProjects} project(s), ${importedEntries} time entry(ies), ${importedPayments} payment(s). Duplicates were skipped.`,
  };
}

export async function deleteAccount(_prevState: SettingsFormState, formData: FormData) {
  const userId = await requireUserId();
  const confirmation = formData.get("confirmation");
  if (confirmation !== "DELETE") {
    return { error: 'Type "DELETE" to confirm.' };
  }

  await prisma.user.delete({ where: { id: userId } });
  (await cookies()).delete("authjs.session-token");
  redirect("/");
}
