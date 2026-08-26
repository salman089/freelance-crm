import { redirect } from "next/navigation";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { GlobalTimer } from "./global-timer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const displayName = session.user.name || session.user.email;

  const runningEntry = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, endedAt: null },
    select: {
      id: true,
      startedAt: true,
      description: true,
      project: { select: { id: true, name: true } },
    },
  });

  const globalTimerEntry = runningEntry
    ? {
        id: runningEntry.id,
        projectId: runningEntry.project.id,
        projectName: runningEntry.project.name,
        startedAt: runningEntry.startedAt.toISOString(),
        description: runningEntry.description,
      }
    : null;

  const signOutForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2.5 text-muted-foreground"
      >
        <SignOut className="size-4" weight="bold" />
        Sign out
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <div className="mb-6 flex items-start justify-between px-1">
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold text-sidebar-foreground">
              Workbase
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {displayName}
            </p>
          </div>
          <ThemeToggle className="shrink-0 text-muted-foreground" />
        </div>

        <SidebarNav />

        <div className="mt-auto space-y-3 pt-4">
          <GlobalTimer runningEntry={globalTimerEntry} />
          {signOutForm}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <p className="shrink-0 font-heading text-base font-semibold text-sidebar-foreground">
          Workbase
        </p>
        <GlobalTimer runningEntry={globalTimerEntry} className="flex-1" />
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ThemeToggle className="text-muted-foreground" />
          {signOutForm}
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-20 pb-24 sm:px-6 md:px-10 md:py-10">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
