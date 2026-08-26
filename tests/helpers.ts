import { expect } from "vitest";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const testPrisma = new PrismaClient({ adapter });

export async function createTestUser(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@workbase.test`;
  return testPrisma.user.create({ data: { email } });
}

export async function deleteTestUser(userId: string) {
  await testPrisma.user.delete({ where: { id: userId } }).catch(() => {});
}

export function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

export async function expectRedirectTo(promise: Promise<unknown>, path: string) {
  await expect(promise).rejects.toMatchObject({
    digest: `NEXT_REDIRECT;${path}`,
  });
}
