import "dotenv/config";
import { vi } from "vitest";

// Server actions call redirect()/revalidatePath() which only work inside a
// real Next.js request. Outside of that, we stub them so the actions' actual
// business logic (validation, Prisma calls) still runs and can be asserted on.

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`) as Error & {
      digest: string;
    };
    error.digest = `NEXT_REDIRECT;${url}`;
    throw error;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
}));
