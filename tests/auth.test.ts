import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { testPrisma, deleteTestUser } from "./helpers";

const adapter = PrismaAdapter(testPrisma);

describe("magic-link auth flow (Prisma adapter)", () => {
  let userId: string;

  afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  it("creates a user the way the Email provider does on first sign-in", async () => {
    const user = await adapter.createUser!({
      email: "auth-flow@workbase.test",
      emailVerified: null,
    } as never);
    userId = user.id;

    expect(user.email).toBe("auth-flow@workbase.test");
  });

  it("issues and consumes a verification token, exactly like clicking the magic-link email", async () => {
    const token = {
      identifier: "auth-flow@workbase.test",
      token: "test-verification-token",
      expires: new Date(Date.now() + 10 * 60_000),
    };

    await adapter.createVerificationToken!(token);

    // Simulate the user clicking the link in their email.
    const used = await adapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    });
    expect(used?.token).toBe(token.token);

    // A verification token can only ever be used once.
    const usedAgain = await adapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    });
    expect(usedAgain).toBeNull();
  });

  it("creates a database session and can look it up by token, like a signed-in request would", async () => {
    const sessionToken = "test-session-token";
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await adapter.createSession!({ sessionToken, userId, expires });

    const result = await adapter.getSessionAndUser!(sessionToken);
    expect(result?.user.id).toBe(userId);
    expect(result?.session.sessionToken).toBe(sessionToken);

    await adapter.deleteSession!(sessionToken);
    const afterDelete = await adapter.getSessionAndUser!(sessionToken);
    expect(afterDelete).toBeNull();
  });
});

describe("requireUserId", () => {
  it("returns the session's user id when authenticated", async () => {
    vi.resetModules();
    vi.doMock("@/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: "user-123" } }),
    }));
    const { requireUserId } = await import("@/lib/session");

    await expect(requireUserId()).resolves.toBe("user-123");
  });

  it("redirects to /login when there is no session", async () => {
    vi.resetModules();
    vi.doMock("@/auth", () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));
    const { requireUserId } = await import("@/lib/session");

    await expect(requireUserId()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;/login",
    });
  });
});
