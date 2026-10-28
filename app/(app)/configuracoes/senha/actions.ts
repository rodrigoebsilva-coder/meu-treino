"use server";

import { createClient } from "@/lib/supabase/server";

export type AlterarSenhaState = { error: string | null; success: boolean };

export async function alterarSenha(_prev: AlterarSenhaState, formData: FormData): Promise<AlterarSenhaState> {
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (nova.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres.", success: false };
  if (nova !== confirmar) return { error: "A confirmação não confere com a nova senha.", success: false };
  if (nova === atual) return { error: "A nova senha precisa ser diferente da atual.", success: false };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return { error: "Sessão expirada. Entre de novo.", success: false };

  // Reconfirma a senha atual: sessão aberta num aparelho emprestado não deve bastar pra trocar a senha.
  const { error: erroAtual } = await supabase.auth.signInWithPassword({ email: data.user.email, password: atual });
  if (erroAtual) return { error: "Senha atual incorreta.", success: false };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { error: error.message, success: false };
  return { error: null, success: true };
}
