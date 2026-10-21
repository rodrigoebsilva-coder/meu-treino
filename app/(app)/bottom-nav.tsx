"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, TrendingUp, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/treino", label: "Treino", Icon: Dumbbell },
  { href: "/evolucao", label: "Evolução", Icon: TrendingUp },
  { href: "/perfil", label: "Perfil", Icon: User },
  { href: "/configuracoes", label: "Config", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t bg-background">
      {ITENS.map(({ href, label, Icon }) => {
        const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              ativo ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
