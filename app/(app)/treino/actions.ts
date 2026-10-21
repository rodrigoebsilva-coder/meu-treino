"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TreinoExercicioEditSchema } from "@/lib/treino/schema";

export type AcaoState = { error: string | null };

const OK: AcaoState = { error: null };

export async function atualizarExercicio(
  treinoExercicioId: string,
  _prev: AcaoState,
  formData: FormData
): Promise<AcaoState> {
  const parsed = TreinoExercicioEditSchema.safeParse({
    exercicio_id: formData.get("exercicio_id"),
    series: formData.get("series"),
    repeticoes_min: formData.get("repeticoes_min"),
    repeticoes_max: formData.get("repeticoes_max"),
    carga_sugerida_kg: formData.get("carga_sugerida_kg") || undefined,
    descanso_segundos: formData.get("descanso_segundos"),
    metodo: formData.get("metodo"),
    observacao: formData.get("observacao") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("treino_exercicios")
    .update({
      ...parsed.data,
      carga_sugerida_kg: parsed.data.carga_sugerida_kg ?? null,
      observacao: parsed.data.observacao ?? null,
    })
    .eq("id", treinoExercicioId);

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/treino");
  return OK;
}

export async function atualizarDicaCasa(
  exercicioId: string,
  _prev: AcaoState,
  formData: FormData
): Promise<AcaoState> {
  const dica = (formData.get("dica_casa") as string | null)?.trim() ?? "";

  const supabase = await createClient();
  const { error } = await supabase.rpc("atualizar_dica_casa", {
    p_exercicio_id: exercicioId,
    p_dica: dica,
  });

  if (error) {
    return { error: "Não foi possível salvar a dica." };
  }

  revalidatePath("/treino");
  return OK;
}

export async function removerExercicio(treinoExercicioId: string): Promise<AcaoState> {
  const supabase = await createClient();
  const { error } = await supabase.from("treino_exercicios").delete().eq("id", treinoExercicioId);

  if (error) {
    return { error: "Não foi possível remover." };
  }

  revalidatePath("/treino");
  return OK;
}

export async function reordenarExercicio(
  treinoDiaId: string,
  treinoExercicioId: string,
  direcao: "cima" | "baixo"
): Promise<AcaoState> {
  const supabase = await createClient();

  const { data: exercicios, error: erroSelect } = await supabase
    .from("treino_exercicios")
    .select("id, ordem")
    .eq("treino_dia_id", treinoDiaId)
    .order("ordem", { ascending: true });

  if (erroSelect || !exercicios) {
    return { error: "Não foi possível reordenar." };
  }

  const index = exercicios.findIndex((e) => e.id === treinoExercicioId);
  const vizinhoIndex = direcao === "cima" ? index - 1 : index + 1;

  if (index < 0 || vizinhoIndex < 0 || vizinhoIndex >= exercicios.length) {
    return OK;
  }

  const atual = exercicios[index];
  const vizinho = exercicios[vizinhoIndex];

  // Troca via um valor temporário: evita colidir com a unique constraint
  // (treino_dia_id, ordem) no meio da operação.
  await supabase.from("treino_exercicios").update({ ordem: -1 }).eq("id", atual.id);
  await supabase.from("treino_exercicios").update({ ordem: atual.ordem }).eq("id", vizinho.id);
  const { error } = await supabase
    .from("treino_exercicios")
    .update({ ordem: vizinho.ordem })
    .eq("id", atual.id);

  if (error) {
    return { error: "Não foi possível reordenar." };
  }

  revalidatePath("/treino");
  return OK;
}
