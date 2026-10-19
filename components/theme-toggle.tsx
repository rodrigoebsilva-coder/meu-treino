"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // resolvedTheme só existe depois do next-themes montar no cliente — evita
  // mismatch de hidratação sem precisar de useEffect + estado próprio.
  if (!resolvedTheme) {
    return <Button variant="outline" size="icon" disabled aria-label="Tema" />;
  }

  const escuro = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Alternar tema"
      onClick={() => setTheme(escuro ? "light" : "dark")}
    >
      {escuro ? <Sun /> : <Moon />}
    </Button>
  );
}
