import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, testPrisma } from "./helpers";

const requireUserId = vi.fn();
vi.mock("@/lib/session", () => ({ requireUserId: () => requireUserId() }));

const { createProject, updateProject, deleteProject } = await import(
  "@/app/(app)/projects/actions"
);

describe("Project CRUD", () => {
  let userId: string;
  let clientId: string;

  beforeEach(async () => {
    if (!userId) {
      userId = (await createTestUser("projects-owner")).id;
      const client = await testPrisma.client.create({
        data: { userId, name: "Test Client" },
      });
      clientId = client.id;
    }
    requireUserId.mockResolvedValue(userId);
  });

  afterAll(async () => {
    await deleteTestUser(userId);
  });

  it("rejects a project without a valid client", async () => {
    const state = await createProject(
      undefined,
      formData({ name: "Orphan Project", clientId: "does-not-exist" })
    );
    expect(state?.error).toBe("Select a client.");
  });

  it("creates an ACTIVE project by default", async () => {
    await expect(
      createProject(undefined, formData({ name: "Website Redesign", clientId }))
    ).rejects.toMatchObject({ digest: "NEXT_REDIRECT;/projects" });

    const project = await testPrisma.project.findFirstOrThrow({
      where: { userId, name: "Website Redesign" },
    });
    expect(project.status).toBe("ACTIVE");
  });

  it("updates a project's status to ARCHIVED", async () => {
    const project = await testPrisma.project.create({
      data: { userId, clientId, name: "Legacy Project" },
    });

    await expect(
      updateProject(
        project.id,
        undefined,
        formData({ name: "Legacy Project", clientId, status: "ARCHIVED" })
      )
    ).rejects.toMatchObject({
      digest: `NEXT_REDIRECT;/projects/${project.id}`,
    });

    const updated = await testPrisma.project.findUniqueOrThrow({
      where: { id: project.id },
    });
    expect(updated.status).toBe("ARCHIVED");
  });

  it("cascades time entries and payments when a project is deleted", async () => {
    const project = await testPrisma.project.create({
      data: { userId, clientId, name: "Fully Doomed" },
    });
    const entry = await testPrisma.timeEntry.create({
      data: {
        userId,
        projectId: project.id,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
    const payment = await testPrisma.payment.create({
      data: { userId, projectId: project.id, amount: 1000 },
    });

    await expect(deleteProject(project.id)).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;/projects",
    });

    expect(await testPrisma.timeEntry.findUnique({ where: { id: entry.id } })).toBeNull();
    expect(await testPrisma.payment.findUnique({ where: { id: payment.id } })).toBeNull();
  });
});
