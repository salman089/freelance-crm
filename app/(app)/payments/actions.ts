"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toMinorUnits, CURRENCIES } from "@/lib/money";
import { PaymentStatus } from "@/app/generated/prisma/enums";

export type PaymentFormState = { error?: string } | undefined;

async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return Boolean(project);
}

function readPaymentFields(formData: FormData) {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Project not found." } as const;
  }

  const amountRaw = formData.get("amount");
  const amount = typeof amountRaw === "string" ? Number(amountRaw) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than zero." } as const;
  }

  const currencyRaw = formData.get("currency");
  const currency = CURRENCIES.includes(currencyRaw as (typeof CURRENCIES)[number])
    ? (currencyRaw as string)
    : "USD";

  const note = (formData.get("note") as string | null)?.trim() || null;
  const dueDateRaw = formData.get("dueDate") as string | null;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  return {
    data: {
      projectId,
      amount: toMinorUnits(amount, currency),
      currency,
      note,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
    },
  } as const;
}

export async function createPayment(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const userId = await requireUserId();
  const parsed = readPaymentFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  if (!(await verifyProjectOwnership(parsed.data.projectId, userId))) {
    return { error: "Project not found." };
  }

  await prisma.payment.create({ data: { ...parsed.data, userId } });
  revalidatePath("/", "layout");
}

export async function updatePayment(
  paymentId: string,
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const userId = await requireUserId();
  const parsed = readPaymentFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  if (!(await verifyProjectOwnership(parsed.data.projectId, userId))) {
    return { error: "Project not found." };
  }

  const { count } = await prisma.payment.updateMany({
    where: { id: paymentId, userId },
    data: parsed.data,
  });
  if (count === 0) return { error: "Payment not found." };

  revalidatePath("/", "layout");
}

export async function setPaymentStatus(paymentId: string, status: PaymentStatus) {
  const userId = await requireUserId();
  await prisma.payment.updateMany({
    where: { id: paymentId, userId },
    data: { status, paidAt: status === "PAID" ? new Date() : null },
  });
  revalidatePath("/", "layout");
}

export async function deletePayment(paymentId: string) {
  const userId = await requireUserId();
  await prisma.payment.deleteMany({ where: { id: paymentId, userId } });
  revalidatePath("/", "layout");
}
