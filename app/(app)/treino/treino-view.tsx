"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/offline/db";
import type { TreinoCompleto, ExercicioResumo } from "@/lib/treino/types";
import { TreinoDiaCard } from "./treino-dia-card";

export function TreinoView({
  treino,
  exerciciosDisponiveis,
}: {
  treino: TreinoCompleto;
  exerciciosDisponiveis: ExercicioResumo[];
}) {
  useEffect(() => {
    void db.treinoCache.put({
      id: treino.id,
      atualizadoEm: new Date().toISOString(),
      dados: treino,
    });
  }, [treino]);

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{treino.nome_ciclo}</h1>
          <p className="text-sm text-muted-foreground">Treino ativo</p>
        </div>
        <Link href="/treino/historico" className="text-sm text-muted-foreground underline">
          Histórico
        </Link>
      </div>

      <Button
        render={<Link href="/treino/gerar-ia">Gerar novo treino com IA</Link>}
        nativeButton={false}
        className="w-fit"
      />

      <div className="flex flex-col gap-4">
        {treino.treino_dias.map((dia) => (
          <TreinoDiaCard key={dia.id} dia={dia} exerciciosDisponiveis={exerciciosDisponiveis} />
        ))}
      </div>
    </main>
  );
}
