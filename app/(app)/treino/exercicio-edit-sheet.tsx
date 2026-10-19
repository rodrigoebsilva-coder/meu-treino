"use client";

import { useActionState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { atualizarExercicio, type AcaoState } from "./actions";
import { METODO_LABEL, type ExercicioResumo, type TreinoExercicioComDados, type MetodoSerie } from "@/lib/treino/types";

const INITIAL_STATE: AcaoState = { error: null };

export function ExercicioEditSheet({
  treinoExercicio,
  exerciciosDisponiveis,
  aberto,
  onOpenChange,
}: {
  treinoExercicio: TreinoExercicioComDados;
  exerciciosDisponiveis: ExercicioResumo[];
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}) {
  const acao = atualizarExercicio.bind(null, treinoExercicio.id);
  const [state, formAction, pending] = useActionState(acao, INITIAL_STATE);

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar exercício</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="exercicio_id">Exercício</Label>
            <Select name="exercicio_id" defaultValue={treinoExercicio.exercicio_id ?? undefined}>
              <SelectTrigger id="exercicio_id" className="w-full">
                <SelectValue>
                  {(valor: string) =>
                    exerciciosDisponiveis.find((e) => e.id === valor)?.nome ?? treinoExercicio.exercicio?.nome
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {exerciciosDisponiveis.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.nome} · {ex.grupo_muscular}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="series">Séries</Label>
              <Input id="series" name="series" type="number" min={1} defaultValue={treinoExercicio.series} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repeticoes_min">Reps min</Label>
              <Input
                id="repeticoes_min"
                name="repeticoes_min"
                type="number"
                min={1}
                defaultValue={treinoExercicio.repeticoes_min}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repeticoes_max">Reps max</Label>
              <Input
                id="repeticoes_max"
                name="repeticoes_max"
                type="number"
                min={1}
                defaultValue={treinoExercicio.repeticoes_max}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="carga_sugerida_kg">Carga sugerida (kg)</Label>
              <Input
                id="carga_sugerida_kg"
                name="carga_sugerida_kg"
                type="number"
                step="0.5"
                defaultValue={treinoExercicio.carga_sugerida_kg ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descanso_segundos">Descanso (s)</Label>
              <Input
                id="descanso_segundos"
                name="descanso_segundos"
                type="number"
                min={0}
                step={5}
                defaultValue={treinoExercicio.descanso_segundos}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="metodo">Método</Label>
            <Select name="metodo" defaultValue={treinoExercicio.metodo}>
              <SelectTrigger id="metodo" className="w-full">
                <SelectValue>{(valor: MetodoSerie) => METODO_LABEL[valor]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METODO_LABEL).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea id="observacao" name="observacao" defaultValue={treinoExercicio.observacao ?? ""} />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
