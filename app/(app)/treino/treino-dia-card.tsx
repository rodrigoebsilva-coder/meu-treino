"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TreinoDiaCompleto, TreinoExercicioComDados, ExercicioResumo } from "@/lib/treino/types";
import { removerExercicio, reordenarExercicios } from "./actions";
import { ExercicioEditSheet } from "./exercicio-edit-sheet";
import { ExercicioVideoButton } from "./exercicio-video-button";

function ExercicioRow({
  ex,
  onEditar,
  onRemover,
}: {
  ex: TreinoExercicioComDados;
  onEditar: () => void;
  onRemover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-2 rounded-md border bg-card p-2 ${isDragging ? "relative z-10 opacity-70" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex flex-col">
          <span className="font-medium">{ex.exercicio?.nome ?? ex.nome_exercicio_sugerido}</span>
          <span className="text-xs text-muted-foreground">
            {ex.series}x {ex.repeticoes_min}-{ex.repeticoes_max} · {ex.descanso_segundos}s descanso
            {ex.carga_sugerida_kg ? ` · ${ex.carga_sugerida_kg}kg` : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ExercicioVideoButton
          nome={ex.exercicio?.nome ?? ex.nome_exercicio_sugerido ?? ""}
          youtubeUrl={ex.exercicio?.youtube_url ?? null}
          compact
        />
        <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={onEditar}>
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Remover" onClick={onRemover}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

export function TreinoDiaCard({
  dia,
  exerciciosDisponiveis,
}: {
  dia: TreinoDiaCompleto;
  exerciciosDisponiveis: ExercicioResumo[];
}) {
  const [editando, setEditando] = useState<TreinoExercicioComDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState(dia.treino_exercicios);
  // Deriva `itens` de `dia.treino_exercicios` (pra pegar edições/remoções
  // vindas do servidor) sem useEffect — comparar e ajustar direto no corpo
  // do render é o jeito recomendado pra "resetar estado quando uma prop
  // muda", e evita o aviso do react-hooks/set-state-in-effect.
  const [diaExerciciosAnterior, setDiaExerciciosAnterior] = useState(dia.treino_exercicios);
  if (dia.treino_exercicios !== diaExerciciosAnterior) {
    setDiaExerciciosAnterior(dia.treino_exercicios);
    setItens(dia.treino_exercicios);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function remover(exercicioId: string) {
    const res = await removerExercicio(exercicioId);
    setErro(res.error);
  }

  async function arrastou(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const indiceAtivo = itens.findIndex((ex) => ex.id === active.id);
    const indiceDestino = itens.findIndex((ex) => ex.id === over.id);
    if (indiceAtivo === -1 || indiceDestino === -1) return;

    const novaOrdem = arrayMove(itens, indiceAtivo, indiceDestino);
    setItens(novaOrdem);
    const res = await reordenarExercicios(novaOrdem.map((ex) => ex.id));
    setErro(res.error);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <button
          type="button"
          className="flex flex-1 flex-col items-start gap-1 text-left"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
        >
          <span className="flex items-center gap-1.5">
            <CardTitle>{dia.nome}</CardTitle>
            {aberto ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </span>
          <div className="flex flex-wrap gap-1">
            {dia.grupos_musculares.map((g) => (
              <Badge key={g} variant="outline">
                {g}
              </Badge>
            ))}
          </div>
        </button>
        <Button render={<Link href={`/treino/executar/${dia.id}`}>Iniciar</Link>} nativeButton={false} />
      </CardHeader>
      {aberto ? (
        <CardContent className="flex flex-col gap-2">
          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={arrastou}>
            <SortableContext items={itens.map((ex) => ex.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {itens.map((ex) => (
                  <ExercicioRow key={ex.id} ex={ex} onEditar={() => setEditando(ex)} onRemover={() => remover(ex.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      ) : null}

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
