"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProvedorIA, ModeloDisponivel } from "@/lib/ai/provider";

export type TestarChaveState = {
  erro: string | null;
  modelos: ModeloDisponivel[] | null;
};

const TESTAR_INICIAL: TestarChaveState = { erro: null, modelos: null };

export async function testarChave(
  _prev: TestarChaveState,
  formData: FormData
): Promise<TestarChaveState> {
  const provedor = formData.get("provedor") as ProvedorIA;
  const chave = String(formData.get("chave") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("listar-modelos", {
    body: { provedor, chave: chave || undefined },
  });

  if (error || !data?.modelos) {
    return { ...TESTAR_INICIAL, erro: "Chave inválida ou provedor fora do ar. Confira e tente de novo." };
  }

  return { erro: null, modelos: data.modelos };
}

export type SalvarConfigIAState = { erro: string | null; sucesso: boolean };

const SALVAR_INICIAL: SalvarConfigIAState = { erro: null, sucesso: false };

export async function salvarConfigIA(
  _prev: SalvarConfigIAState,
  formData: FormData
): Promise<SalvarConfigIAState> {
  const provedor = formData.get("provedor") as ProvedorIA;
  const modelo = String(formData.get("modelo") ?? "");
  const chave = String(formData.get("chave") ?? "");

  if (!provedor || !modelo) {
    return { ...SALVAR_INICIAL, erro: "Selecione o provedor e o modelo." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ...SALVAR_INICIAL, erro: "Sessão expirada. Faça login novamente." };
  }

  if (chave) {
    const { error: erroChave } = await supabase.rpc("vault_set_ai_key", {
      p_provedor: provedor,
      p_chave: chave,
    });
    if (erroChave) {
      return { ...SALVAR_INICIAL, erro: "Não foi possível salvar a chave." };
    }
  }

  const { error: erroConfig } = await supabase
    .from("config_ia")
    .upsert({ user_id: userData.user.id, provedor_padrao: provedor, modelo_padrao: modelo });
  if (erroConfig) {
    return { ...SALVAR_INICIAL, erro: "Não foi possível salvar as configurações." };
  }

  revalidatePath("/configuracoes/ia");
  return { erro: null, sucesso: true };
}
