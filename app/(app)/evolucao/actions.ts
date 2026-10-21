"use server";

import { createClient } from "@/lib/supabase/server";
import { buscarCargaExercicio } from "@/lib/evolucao/dados";

export async function buscarHistoricoCarga(exercicioId: string) {
  const supabase = await createClient();
  return buscarCargaExercicio(supabase, exercicioId);
}
