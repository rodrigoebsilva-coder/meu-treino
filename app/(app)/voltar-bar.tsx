"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// iOS não tem botão "voltar" do sistema (Android tem) — barra fixa no topo de
// toda página, menos o início.
export function VoltarBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/" || pathname.startsWith("/primeiro-acesso")) return null;

  function voltar() {
    if (window.history.length > 1) {
      router.back();
    } else {
      // PWA aberto direto numa página interna: sem histórico, sobe um nível.
      router.push(pathname.split("/").slice(0, -1).join("/") || "/");
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
      <button
        type="button"
        onClick={voltar}
        aria-label="Voltar"
        className="flex h-11 items-center gap-1 px-3 text-sm text-muted-foreground active:text-foreground"
      >
        <ChevronLeft className="size-5" />
        Voltar
      </button>
    </div>
  );
}
