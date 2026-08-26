import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, testPrisma } from "./helpers";
import { formatDuration } from "@/lib/format";

const requireUserId = vi.fn();
vi.mock("@/lib/session", () => ({ requireUserId: () => requireUserId() }));

const { startTimer, stopTimer } = await import("@/app/(app)/time/actions");

async function getRunningEntry(userId: string) {
  // The exact query every page/layout uses to recover timer state on load —
  // this is what makes "survives a browser refresh" true: nothing lives in
  // React state, it's re-derived from the DB on every request.
  return testPrisma.timeEntry.findFirst({ where: { userId, endedAt: null } });
}

describe("Timer edge cases", () => {
  let userId: string;
  let otherUserId: string;
  let projectA: string;
  let projectB: string;

  beforeEach(async () => {
    if (!userId) {
      userId = (await createTestUser("timer-owner")).id;
      otherUserId = (await createTestUser("timer-intruder")).id;
      const client = await testPrisma.client.create({
        data: { userId, name: "Timer Test Client" },
      });
      const [pa, pb] = await Promise.all([
        testPrisma.project.create({
          data: { userId, clientId: client.id, name: "Project A" },
        }),
        testPrisma.project.create({
          data: { userId, clientId: client.id, name: "Project B" },
        }),
      ]);
      projectA = pa.id;
      projectB = pb.id;
    }
    requireUserId.mockResolvedValue(userId);
    // Clean slate between tests: no running entries left over.
    await testPrisma.timeEntry.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  });

  it("refuses to start a timer without a task title", async () => {
    const state = await startTimer(
      undefined,
      formData({ projectId: projectA, description: "   " })
    );
    expect(state?.error).toBe("Enter what you're working on.");
    expect(await getRunningEntry(userId)).toBeNull();
  });

  it("starts a timer that immediately survives a simulated browser refresh", async () => {
    await startTimer(
      undefined,
      formData({ projectId: projectA, description: "Design review" })
    );

    // "Refresh" = throw away all local state and re-query from scratch.
    const running = await getRunningEntry(userId);
    expect(running).not.toBeNull();
    expect(running?.projectId).toBe(projectA);
    expect(running?.description).toBe("Design review");
    expect(running?.endedAt).toBeNull();
  });

  it("enforces a single running timer: starting a new one stops the old one", async () => {
    await startTimer(
      undefined,
      formData({ projectId: projectA, description: "First task" })
    );
    const first = await getRunningEntry(userId);
    expect(first).not.toBeNull();

    // Move to a different project without stopping first — the UI allows this
    // via "Start here instead".
    await startTimer(
      undefined,
      formData({ projectId: projectB, description: "Second task" })
    );

    const firstAfter = await testPrisma.timeEntry.findUniqueOrThrow({
      where: { id: first!.id },
    });
    expect(firstAfter.endedAt).not.toBeNull();

    const nowRunning = await getRunningEntry(userId);
    expect(nowRunning?.projectId).toBe(projectB);
    expect(nowRunning?.description).toBe("Second task");

    // Never more than one running entry for a user at a time.
    const allRunning = await testPrisma.timeEntry.findMany({
      where: { userId, endedAt: null },
    });
    expect(allRunning).toHaveLength(1);
  });

  it("stops the running timer and computes a correct duration", async () => {
    await startTimer(
      undefined,
      formData({ projectId: projectA, description: "Billable work" })
    );
    const running = await getRunningEntry(userId);

    await stopTimer(running!.id);

    const stopped = await testPrisma.timeEntry.findUniqueOrThrow({
      where: { id: running!.id },
    });
    expect(stopped.endedAt).not.toBeNull();
    expect(stopped.endedAt!.getTime()).toBeGreaterThanOrEqual(
      stopped.startedAt.getTime()
    );
    expect(await getRunningEntry(userId)).toBeNull();
  });

  it("correctly stops a timer that was started before midnight, into the next day", async () => {
    // Directly seed an entry that started yesterday at 23:50 — simulates a
    // timer left running overnight.
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - 1);
    startedAt.setHours(23, 50, 0, 0);

    const entry = await testPrisma.timeEntry.create({
      data: { userId, projectId: projectA, startedAt, description: "Overnight" },
    });

    await stopTimer(entry.id);

    const stopped = await testPrisma.timeEntry.findUniqueOrThrow({
      where: { id: entry.id },
    });
    expect(stopped.endedAt).not.toBeNull();

    const elapsedMs = stopped.endedAt!.getTime() - stopped.startedAt.getTime();
    expect(elapsedMs).toBeGreaterThan(0);
    // Should read as hours (it ran overnight), never negative or NaN.
    expect(formatDuration(elapsedMs)).toMatch(/^\d+h \d+m$/);
  });

  it("cannot start or stop a timer on a project you don't own", async () => {
    const intruderClient = await testPrisma.client.create({
      data: { userId: otherUserId, name: "Intruder Client" },
    });
    const intrudersProject = await testPrisma.project.create({
      data: { userId: otherUserId, clientId: intruderClient.id, name: "Not Yours" },
    });

    const state = await startTimer(
      undefined,
      formData({ projectId: intrudersProject.id, description: "Sneaky" })
    );
    expect(state?.error).toBe("Project not found.");

    // And stopping someone else's running entry should be a no-op.
    const theirEntry = await testPrisma.timeEntry.create({
      data: {
        userId: otherUserId,
        projectId: intrudersProject.id,
        startedAt: new Date(),
      },
    });
    await stopTimer(theirEntry.id);

    const stillRunning = await testPrisma.timeEntry.findUniqueOrThrow({
      where: { id: theirEntry.id },
    });
    expect(stillRunning.endedAt).toBeNull();
  });
});
