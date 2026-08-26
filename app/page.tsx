import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Users, FolderOpen } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Users,
    title: "Client directory",
    description:
      "Keep every client's contact details and notes in one organized place.",
  },
  {
    icon: FolderOpen,
    title: "Project tracking",
    description:
      "Group work by client and project, and keep tabs on what's active.",
  },
  {
    icon: Clock,
    title: "Track time easily",
    description:
      "Start a timer on any project and pick up right where you left off, even after a reload.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <p className="font-heading text-lg font-semibold">Workbase</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Log in
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-3xl px-6 pt-20 pb-16 text-center sm:px-10">
          <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Organised work.
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple and efficient for individuals
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Workbase is a simple workspace for managing your projects, time, and clients. Everything you need is organised in one clear and easy-to-use place.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
              Get started
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-3 sm:px-10">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-2">
                <Icon className="size-5" weight="bold" />
                <h2 className="font-heading text-lg font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground sm:px-10">
        © {new Date().getFullYear()} Workbase
      </footer>
    </div>
  );
}
