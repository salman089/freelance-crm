"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type ClientFormState = { error?: string } | undefined;

function readClientFields(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required." } as const;
  }

  return {
    data: {
      name: name.trim(),
      email: (formData.get("email") as string | null)?.trim() || null,
      company: (formData.get("company") as string | null)?.trim() || null,
      notes: (formData.get("notes") as string | null)?.trim() || null,
    },
  } as const;
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const userId = await requireUserId();
  const parsed = readClientFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.client.create({ data: { ...parsed.data, userId } });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const userId = await requireUserId();
  const parsed = readClientFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { count } = await prisma.client.updateMany({
    where: { id: clientId, userId },
    data: parsed.data,
  });
  if (count === 0) return { error: "Client not found." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const userId = await requireUserId();
  await prisma.client.deleteMany({ where: { id: clientId, userId } });
  revalidatePath("/clients");
  redirect("/clients");
}
