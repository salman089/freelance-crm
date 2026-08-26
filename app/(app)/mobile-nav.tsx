"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  FolderOpen,
  Clock,
  Users,
  Gear,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: SquaresFour },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/time", label: "Track", icon: Clock },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Gear },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar md:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" weight={active ? "bold" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
