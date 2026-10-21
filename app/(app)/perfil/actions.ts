"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AnamneseSchema } from "@/lib/perfil/schema";
import { DadosSchema } from "@/lib/perfil/dados-schema";

export type SalvarAnamneseState = { error: string | null; success: boolean };

export async function salvarAnamnese(
  _prev: SalvarAnamneseState,
  formData: FormData
): Promise<SalvarAnamneseState> {
  const parsed = AnamneseSchema.safeParse({
    idade: formData.get("idade"),
    altura_cm: formData.get("altura_cm"),
    peso_inicial_kg: formData.get("peso_inicial_kg"),
    nivel: formData.get("nivel"),
    lesoes: formData.get("lesoes") || undefined,
    objetivo: formData.get("objetivo"),
    dias_disponiveis: formData.get("dias_disponiveis"),
    local_treino: formData.get("local_treino"),
    observacoes: formData.get("observacoes") || undefined,
    meta_peso_kg: formData.get("meta_peso_kg") || undefined,
    meta_prazo: formData.get("meta_prazo") || undefined,
    sexo: formData.get("sexo") || undefined,
    cintura_cm: formData.get("cintura_cm") || undefined,
    quadril_cm: formData.get("quadril_cm") || undefined,
    peito_cm: formData.get("peito_cm") || undefined,
    braco_cm: formData.get("braco_cm") || undefined,
    coxa_cm: formData.get("coxa_cm") || undefined,
    pescoco_cm: formData.get("pescoco_cm") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", success: false };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const { data: ultima } = await supabase
    .from("anamneses")
    .select("versao")
    .eq("user_id", userData.user.id)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const proximaVersao = (ultima?.versao ?? 0) + 1;

  const { error } = await supabase.from("anamneses").insert({
    ...parsed.data,
    lesoes: parsed.data.lesoes ?? null,
    observacoes: parsed.data.observacoes ?? null,
    meta_peso_kg: parsed.data.meta_peso_kg ?? null,
    meta_prazo: parsed.data.meta_prazo ?? null,
    sexo: parsed.data.sexo ?? null,
    cintura_cm: parsed.data.cintura_cm ?? null,
    quadril_cm: parsed.data.quadril_cm ?? null,
    peito_cm: parsed.data.peito_cm ?? null,
    braco_cm: parsed.data.braco_cm ?? null,
    coxa_cm: parsed.data.coxa_cm ?? null,
    pescoco_cm: parsed.data.pescoco_cm ?? null,
    versao: proximaVersao,
    user_id: userData.user.id,
  });

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo.", success: false };
  }

  revalidatePath("/perfil");
  revalidatePath("/");
  return { error: null, success: true };
}

export type SalvarDadosState = { error: string | null; success: boolean };

export async function salvarDados(_prev: SalvarDadosState, formData: FormData): Promise<SalvarDadosState> {
  const parsed = DadosSchema.safeParse({
    nome: formData.get("nome"),
    data_nascimento: formData.get("data_nascimento"),
    telefone: formData.get("telefone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", success: false };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const { error } = await supabase
    .from("perfis")
    .update({
      nome: parsed.data.nome,
      data_nascimento: parsed.data.data_nascimento,
      telefone: parsed.data.telefone ?? null,
    })
    .eq("user_id", userData.user.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo.", success: false };
  }

  revalidatePath("/perfil");
  return { error: null, success: true };
}
