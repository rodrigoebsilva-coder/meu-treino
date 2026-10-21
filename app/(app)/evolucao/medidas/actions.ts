"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MedidaSchema } from "@/lib/evolucao/schema";

export type MedidaState = { erro: string | null; sucesso: boolean };

const INICIAL: MedidaState = { erro: null, sucesso: false };

export async function salvarMedida(_prev: MedidaState, formData: FormData): Promise<MedidaState> {
  const parsed = MedidaSchema.safeParse({
    registrado_em: formData.get("registrado_em"),
    peso_kg: formData.get("peso_kg") || undefined,
    cintura_cm: formData.get("cintura_cm") || undefined,
    peito_cm: formData.get("peito_cm") || undefined,
    braco_cm: formData.get("braco_cm") || undefined,
  });

  if (!parsed.success) {
    return { ...INICIAL, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ...INICIAL, erro: "Sessão expirada. Faça login novamente." };
  }

  // Upsert substitui a linha inteira — busca o que já existe nesse dia
  // primeiro e mescla, senão um campo deixado em branco apaga um valor
  // já salvo antes nesse mesmo dia (bug real, encontrado testando).
  const { data: existente } = await supabase
    .from("medidas")
    .select("peso_kg, cintura_cm, peito_cm, braco_cm")
    .eq("user_id", userData.user.id)
    .eq("registrado_em", parsed.data.registrado_em)
    .maybeSingle();

  const { error } = await supabase
    .from("medidas")
    .upsert(
      {
        user_id: userData.user.id,
        registrado_em: parsed.data.registrado_em,
        peso_kg: parsed.data.peso_kg ?? existente?.peso_kg ?? null,
        cintura_cm: parsed.data.cintura_cm ?? existente?.cintura_cm ?? null,
        peito_cm: parsed.data.peito_cm ?? existente?.peito_cm ?? null,
        braco_cm: parsed.data.braco_cm ?? existente?.braco_cm ?? null,
      },
      { onConflict: "user_id,registrado_em" }
    );

  if (error) {
    return { ...INICIAL, erro: "Não foi possível salvar." };
  }

  revalidatePath("/evolucao");
  revalidatePath("/evolucao/medidas");
  return { erro: null, sucesso: true };
}

export async function removerMedida(id: string): Promise<{ erro: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("medidas").delete().eq("id", id);
  if (error) {
    return { erro: "Não foi possível remover." };
  }
  revalidatePath("/evolucao");
  revalidatePath("/evolucao/medidas");
  return { erro: null };
}
