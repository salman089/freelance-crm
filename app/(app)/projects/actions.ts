"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@/app/generated/prisma/enums";

export type ProjectFormState = { error?: string } | undefined;

async function readProjectFields(formData: FormData, userId: string) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required." } as const;
  }

  const clientId = formData.get("clientId");
  if (typeof clientId !== "string" || !clientId) {
    return { error: "Select a client." } as const;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!client) return { error: "Select a client." } as const;

  const statusRaw = formData.get("status");
  const status =
    statusRaw === "ARCHIVED" ? ProjectStatus.ARCHIVED : ProjectStatus.ACTIVE;

  return {
    data: { name: name.trim(), clientId, status },
  } as const;
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const userId = await requireUserId();
  const parsed = await readProjectFields(formData, userId);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.project.create({ data: { ...parsed.data, userId } });
  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  redirect("/projects");
}

export async function updateProject(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const userId = await requireUserId();
  const parsed = await readProjectFields(formData, userId);
  if ("error" in parsed) return { error: parsed.error };

  const { count } = await prisma.project.updateMany({
    where: { id: projectId, userId },
    data: parsed.data,
  });
  if (count === 0) return { error: "Project not found." };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const userId = await requireUserId();
  await prisma.project.deleteMany({ where: { id: projectId, userId } });
  revalidatePath("/projects");
  redirect("/projects");
}
