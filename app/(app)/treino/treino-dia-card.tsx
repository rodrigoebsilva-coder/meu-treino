"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TreinoDiaCompleto, TreinoExercicioComDados, ExercicioResumo } from "@/lib/treino/types";
import { removerExercicio, reordenarExercicio } from "./actions";
import { ExercicioEditSheet } from "./exercicio-edit-sheet";

export function TreinoDiaCard({
  dia,
  exerciciosDisponiveis,
}: {
  dia: TreinoDiaCompleto;
  exerciciosDisponiveis: ExercicioResumo[];
}) {
  const [editando, setEditando] = useState<TreinoExercicioComDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function mover(exercicioId: string, direcao: "cima" | "baixo") {
    const res = await reordenarExercicio(dia.id, exercicioId, direcao);
    setErro(res.error);
  }

  async function remover(exercicioId: string) {
    const res = await removerExercicio(exercicioId);
    setErro(res.error);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{dia.nome}</CardTitle>
          <div className="mt-1 flex flex-wrap gap-1">
            {dia.grupos_musculares.map((g) => (
              <Badge key={g} variant="outline">
                {g}
              </Badge>
            ))}
          </div>
        </div>
        <Button render={<Link href={`/treino/executar/${dia.id}`}>Iniciar</Link>} nativeButton={false} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

        {dia.treino_exercicios.map((ex, i) => (
          <div key={ex.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
            <div className="flex flex-col">
              <span className="font-medium">{ex.exercicio?.nome ?? ex.nome_exercicio_sugerido}</span>
              <span className="text-xs text-muted-foreground">
                {ex.series}x {ex.repeticoes_min}-{ex.repeticoes_max} · {ex.descanso_segundos}s descanso
                {ex.carga_sugerida_kg ? ` · ${ex.carga_sugerida_kg}kg` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mover para cima"
                disabled={i === 0}
                onClick={() => mover(ex.id, "cima")}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mover para baixo"
                disabled={i === dia.treino_exercicios.length - 1}
                onClick={() => mover(ex.id, "baixo")}
              >
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditando(ex)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Remover" onClick={() => remover(ex.id)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {editando ? (
        <ExercicioEditSheet
          treinoExercicio={editando}
          exerciciosDisponiveis={exerciciosDisponiveis}
          aberto={!!editando}
          onOpenChange={(aberto) => !aberto && setEditando(null)}
        />
      ) : null}
    </Card>
  );
}
