"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, KeyRound, ListChecks, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
}

const TABS = [
  { href: "", label: "Chat", icon: MessageSquare },
  { href: "/api", label: "API y modelo", icon: KeyRound },
  { href: "/instrucciones", label: "Instrucciones y reglas", icon: ListChecks },
  { href: "/info", label: "Info de la empresa", icon: Building2 },
  { href: "/conversaciones", label: "Conversaciones", icon: Users },
];

export function ExampleNav({ slug }: Props) {
  const pathname = usePathname();
  const base = `/ejemplos/${slug}`;

  return (
    <nav className="glass mb-6 flex flex-wrap gap-1 rounded-lg border border-border/50 p-1">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
