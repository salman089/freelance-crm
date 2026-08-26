"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type SignInState = { error?: string } | undefined;

export async function signInWithEmail(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "Enter a valid email address." };
  }

  try {
    await signIn("resend", { email, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not send the sign-in email. Try again." };
    }
    throw error;
  }
}
