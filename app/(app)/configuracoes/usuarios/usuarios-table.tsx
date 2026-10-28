"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARGO_LABEL } from "@/lib/perfil/dados-schema";
import { Button } from "@/components/ui/button";
import { atualizarCargo, liberarGeracao } from "./actions";

type Cargo = "admin" | "professor" | "aluno";

export function UsuariosTable({
  usuarios,
  meuUserId,
  creditosPorUsuario,
}: {
  usuarios: { user_id: string; email: string; nome: string | null; cargo: Cargo }[];
  meuUserId: string;
  creditosPorUsuario: Record<string, number>;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function mudarCargo(userId: string, cargo: Cargo) {
    setErro(null);
    startTransition(async () => {
      const res = await atualizarCargo(userId, cargo);
      setErro(res.erro);
    });
  }

  function liberar(userId: string) {
    setErro(null);
    startTransition(async () => {
      const res = await liberarGeracao(userId);
      setErro(res.erro);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      {usuarios.map((u) => (
        <div key={u.user_id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{u.nome ?? u.email}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            </div>
            <Select
              value={u.cargo}
              onValueChange={(v) => v && mudarCargo(u.user_id, v as Cargo)}
              disabled={pending || u.user_id === meuUserId}
            >
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue>{(valor: Cargo) => CARGO_LABEL[valor]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CARGO_LABEL).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {u.cargo === "admin" ? (
            <p className="text-sm text-muted-foreground">Gerações de treino: ilimitadas</p>
          ) : (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Gerações disponíveis: <strong className="text-foreground">{creditosPorUsuario[u.user_id] ?? 1}</strong>
              </span>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => liberar(u.user_id)}>
                Liberar +1
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
