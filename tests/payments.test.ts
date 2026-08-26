import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, testPrisma } from "./helpers";

const requireUserId = vi.fn();
vi.mock("@/lib/session", () => ({ requireUserId: () => requireUserId() }));

const { createPayment, updatePayment, setPaymentStatus, deletePayment } =
  await import("@/app/(app)/payments/actions");

describe("Payment CRUD", () => {
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    if (!userId) {
      userId = (await createTestUser("payments-owner")).id;
      const client = await testPrisma.client.create({
        data: { userId, name: "Payments Test Client" },
      });
      const project = await testPrisma.project.create({
        data: { userId, clientId: client.id, name: "Billable Project" },
      });
      projectId = project.id;
    }
    requireUserId.mockResolvedValue(userId);
  });

  afterAll(async () => {
    await deleteTestUser(userId);
  });

  it("rejects a zero or negative amount", async () => {
    const state = await createPayment(
      undefined,
      formData({ projectId, amount: "0", currency: "USD" })
    );
    expect(state?.error).toBe("Enter an amount greater than zero.");
  });

  it("stores the amount in minor units (dollars -> cents)", async () => {
    await createPayment(
      undefined,
      formData({ projectId, amount: "499.99", currency: "USD", note: "Deposit" })
    );

    const payment = await testPrisma.payment.findFirstOrThrow({
      where: { userId, note: "Deposit" },
    });
    expect(payment.amount).toBe(49999);
    expect(payment.status).toBe("PENDING");
  });

  it("toggles a payment between pending and paid", async () => {
    const payment = await testPrisma.payment.create({
      data: { userId, projectId, amount: 10000, currency: "USD" },
    });

    await setPaymentStatus(payment.id, "PAID");
    let updated = await testPrisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(updated.status).toBe("PAID");
    expect(updated.paidAt).not.toBeNull();

    await setPaymentStatus(payment.id, "PENDING");
    updated = await testPrisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(updated.status).toBe("PENDING");
    expect(updated.paidAt).toBeNull();
  });

  it("updates an existing payment's amount and currency", async () => {
    const payment = await testPrisma.payment.create({
      data: { userId, projectId, amount: 5000, currency: "USD" },
    });

    await updatePayment(
      payment.id,
      undefined,
      formData({ projectId, amount: "60", currency: "EUR" })
    );

    const updated = await testPrisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(updated.amount).toBe(6000);
    expect(updated.currency).toBe("EUR");
  });

  it("deletes a payment", async () => {
    const payment = await testPrisma.payment.create({
      data: { userId, projectId, amount: 1000, currency: "USD" },
    });

    await deletePayment(payment.id);

    expect(await testPrisma.payment.findUnique({ where: { id: payment.id } })).toBeNull();
  });
});
