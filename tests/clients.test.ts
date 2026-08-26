import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, testPrisma } from "./helpers";

const requireUserId = vi.fn();
vi.mock("@/lib/session", () => ({ requireUserId: () => requireUserId() }));

const { createClient, updateClient, deleteClient } = await import(
  "@/app/(app)/clients/actions"
);

describe("Client CRUD", () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    if (!userId) {
      userId = (await createTestUser("clients-owner")).id;
      otherUserId = (await createTestUser("clients-intruder")).id;
    }
    requireUserId.mockResolvedValue(userId);
  });

  afterAll(async () => {
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  });

  it("rejects creating a client with no name", async () => {
    const state = await createClient(undefined, formData({ name: "   " }));
    expect(state?.error).toBe("Name is required.");
  });

  it("creates a client and redirects to the list", async () => {
    await expect(
      createClient(
        undefined,
        formData({ name: "Acme Corp", email: "hello@acme.test" })
      )
    ).rejects.toMatchObject({ digest: "NEXT_REDIRECT;/clients" });

    const client = await testPrisma.client.findFirst({
      where: { userId, name: "Acme Corp" },
    });
    expect(client).not.toBeNull();
    expect(client?.email).toBe("hello@acme.test");
  });

  it("updates an existing client", async () => {
    const client = await testPrisma.client.create({
      data: { userId, name: "Old Name" },
    });

    await expect(
      updateClient(client.id, undefined, formData({ name: "New Name" }))
    ).rejects.toMatchObject({ digest: `NEXT_REDIRECT;/clients/${client.id}` });

    const updated = await testPrisma.client.findUniqueOrThrow({
      where: { id: client.id },
    });
    expect(updated.name).toBe("New Name");
  });

  it("prevents one user from updating another user's client", async () => {
    const client = await testPrisma.client.create({
      data: { userId: otherUserId, name: "Not Yours" },
    });

    const state = await updateClient(
      client.id,
      undefined,
      formData({ name: "Hijacked" })
    );
    expect(state?.error).toBe("Client not found.");

    const unchanged = await testPrisma.client.findUniqueOrThrow({
      where: { id: client.id },
    });
    expect(unchanged.name).toBe("Not Yours");
  });

  it("deletes a client and cascades its projects", async () => {
    const client = await testPrisma.client.create({
      data: { userId, name: "To Delete" },
    });
    const project = await testPrisma.project.create({
      data: { userId, clientId: client.id, name: "Doomed Project" },
    });

    await expect(deleteClient(client.id)).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;/clients",
    });

    expect(await testPrisma.client.findUnique({ where: { id: client.id } })).toBeNull();
    expect(
      await testPrisma.project.findUnique({ where: { id: project.id } })
    ).toBeNull();
  });

  it("prevents deleting another user's client", async () => {
    const client = await testPrisma.client.create({
      data: { userId: otherUserId, name: "Protected" },
    });

    await expect(deleteClient(client.id)).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;/clients",
    });

    expect(await testPrisma.client.findUnique({ where: { id: client.id } })).not.toBeNull();
  });
});
