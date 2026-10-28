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
    duracao_minutos: formData.get("duracao_minutos") || undefined,
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
      duracao_minutos: parsed.data.duracao_minutos ?? null,
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

// Reordenação por arrastar (clica e arrasta, substituiu as antigas setas
// cima/baixo) — recebe a lista inteira de ids na ordem final e regrava
// `ordem` de todos de uma vez. Dois passos (uma faixa negativa temporária,
// depois os valores finais) pra nunca colidir com a unique constraint
// (treino_dia_id, ordem) no meio do caminho.
export async function reordenarExercicios(idsEmOrdem: string[]): Promise<AcaoState> {
  const supabase = await createClient();

  for (let i = 0; i < idsEmOrdem.length; i++) {
    const { error } = await supabase
      .from("treino_exercicios")
      .update({ ordem: -(i + 1) })
      .eq("id", idsEmOrdem[i]);
    if (error) return { error: "Não foi possível reordenar." };
  }

  for (let i = 0; i < idsEmOrdem.length; i++) {
    const { error } = await supabase
      .from("treino_exercicios")
      .update({ ordem: i + 1 })
      .eq("id", idsEmOrdem[i]);
    if (error) return { error: "Não foi possível reordenar." };
  }

  revalidatePath("/treino");
  return OK;
}

