import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "./sign-in-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-zinc-500">
            We&apos;ll email you a magic link.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
