import { criarClienteDoUsuario } from "../_shared/user-client.ts";
import { listarModelosClaude } from "../_shared/providers/claude.ts";
import { listarModelosGemini } from "../_shared/providers/gemini.ts";

interface CorpoRequisicao {
  provedor: "claude" | "gemini";
  chave?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = criarClienteDoUsuario(req);
  if (!supabase) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  let corpo: CorpoRequisicao;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { provedor } = corpo;
  let chave = corpo.chave;

  // Sem chave no corpo: usa a já salva no Vault (caso de trocar de provedor
  // na tela de gerar treino, sem precisar digitar a chave de novo).
  if (!chave) {
    const { data, error } = await supabase.rpc("vault_get_ai_key", { p_provedor: provedor });
    if (error || !data) {
      return Response.json({ error: "Nenhuma chave configurada para esse provedor." }, { status: 400 });
    }
    chave = data;
  }

  try {
    const modelos =
      provedor === "claude" ? await listarModelosClaude(chave) : await listarModelosGemini(chave);
    return Response.json({ modelos });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `Não foi possível listar os modelos: ${mensagem}` }, { status: 502 });
  }
});
