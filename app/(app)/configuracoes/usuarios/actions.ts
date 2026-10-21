"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AtualizarCargoState = { erro: string | null };

export async function atualizarCargo(userId: string, novoCargo: "admin" | "professor" | "aluno"): Promise<AtualizarCargoState> {
  const supabase = await createClient();

  const { error } = await supabase.from("perfis").update({ cargo: novoCargo }).eq("user_id", userId);

  if (error) {
    return { erro: "Não foi possível alterar o cargo. Só admin pode fazer isso." };
  }

  revalidatePath("/configuracoes/usuarios");
  return { erro: null };
}
