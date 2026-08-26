"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return Boolean(project);
}

export type StartTimerState = { error?: string } | undefined;

export async function startTimer(
  _prevState: StartTimerState,
  formData: FormData
): Promise<StartTimerState> {
  const userId = await requireUserId();
  const projectId = formData.get("projectId");
  const description = (formData.get("description") as string | null)?.trim();

  if (typeof projectId !== "string" || !projectId) {
    return { error: "Project not found." };
  }
  if (!(await verifyProjectOwnership(projectId, userId))) {
    return { error: "Project not found." };
  }
  if (!description) {
    return { error: "Enter what you're working on." };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.timeEntry.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: now },
    }),
    prisma.timeEntry.create({
      data: { projectId, userId, startedAt: now, description },
    }),
  ]);

  revalidatePath("/", "layout");
}

export async function stopTimer(entryId: string) {
  const userId = await requireUserId();
  await prisma.timeEntry.updateMany({
    where: { id: entryId, userId, endedAt: null },
    data: { endedAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export type TimeEntryFormState = { error?: string } | undefined;

async function readTimeEntryFields(formData: FormData, userId: string) {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Select a project." } as const;
  }
  if (!(await verifyProjectOwnership(projectId, userId))) {
    return { error: "Select a project." } as const;
  }

  const startedAtRaw = formData.get("startedAt");
  const endedAtRaw = formData.get("endedAt");
  if (typeof startedAtRaw !== "string" || typeof endedAtRaw !== "string") {
    return { error: "Start and end time are required." } as const;
  }

  const startedAt = new Date(startedAtRaw);
  const endedAt = new Date(endedAtRaw);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return { error: "Start and end time are required." } as const;
  }
  if (endedAt <= startedAt) {
    return { error: "End time must be after start time." } as const;
  }

  const description =
    (formData.get("description") as string | null)?.trim() || null;

  return {
    data: { projectId, startedAt, endedAt, description },
  } as const;
}

export async function createTimeEntry(
  _prevState: TimeEntryFormState,
  formData: FormData
): Promise<TimeEntryFormState> {
  const userId = await requireUserId();
  const parsed = await readTimeEntryFields(formData, userId);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.timeEntry.create({ data: { ...parsed.data, userId } });
  revalidatePath("/", "layout");
  redirect("/time");
}

export async function updateTimeEntry(
  entryId: string,
  _prevState: TimeEntryFormState,
  formData: FormData
): Promise<TimeEntryFormState> {
  const userId = await requireUserId();
  const parsed = await readTimeEntryFields(formData, userId);
  if ("error" in parsed) return { error: parsed.error };

  const { count } = await prisma.timeEntry.updateMany({
    where: { id: entryId, userId },
    data: parsed.data,
  });
  if (count === 0) return { error: "Time entry not found." };

  revalidatePath("/", "layout");
  redirect("/time");
}

export async function deleteTimeEntry(entryId: string) {
  const userId = await requireUserId();
  await prisma.timeEntry.deleteMany({ where: { id: entryId, userId } });
  revalidatePath("/", "layout");
}
