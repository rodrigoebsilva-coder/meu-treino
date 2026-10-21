import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente escopado ao JWT de quem chamou (nunca a service role) — assim
// `vault_get_ai_key` e as policies de RLS continuam valendo auth.uid() do
// usuário real, igual ao comportamento do navegador/Next.js.
export function criarClienteDoUsuario(req: Request): SupabaseClient | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}
