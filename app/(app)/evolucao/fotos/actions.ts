"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registrarFoto(storagePath: string, registradoEm: string): Promise<{ erro: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sessão expirada." };
  }

  const { error } = await supabase.from("fotos_progresso").insert({
    user_id: userData.user.id,
    storage_path: storagePath,
    registrado_em: registradoEm,
  });

  if (error) {
    return { erro: "Não foi possível registrar a foto." };
  }

  revalidatePath("/evolucao/fotos");
  return { erro: null };
}

export async function removerFoto(id: string, storagePath: string): Promise<{ erro: string | null }> {
  const supabase = await createClient();

  await supabase.storage.from("fotos-progresso").remove([storagePath]);

  const { error } = await supabase.from("fotos_progresso").delete().eq("id", id);
  if (error) {
    return { erro: "Não foi possível remover a foto." };
  }

  revalidatePath("/evolucao/fotos");
  return { erro: null };
}
