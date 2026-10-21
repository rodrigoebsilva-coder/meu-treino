import { TreinoGeradoSchema, type TipoAcao, type TreinoGerado } from "../_shared/schemas.ts";
import { criarClienteDoUsuario } from "../_shared/user-client.ts";
import { gerarComClaude } from "../_shared/providers/claude.ts";
import { gerarComGemini } from "../_shared/providers/gemini.ts";
import { montarContexto } from "./contexto.ts";
import { montarSystemPrompt, montarUserPrompt } from "./prompts.ts";

interface CorpoRequisicao {
  provedor: "claude" | "gemini";
  modelo: string;
  tipoAcao: TipoAcao;
  pedidoUsuario: string;
  propostaAnterior?: TreinoGerado;
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

  const { provedor, modelo, tipoAcao, pedidoUsuario, propostaAnterior } = corpo;
  if (!provedor || !modelo || !tipoAcao) {
    return Response.json({ error: "Faltam provedor, modelo ou tipo de ação." }, { status: 400 });
  }

  const { data: chave, error: erroChave } = await supabase.rpc("vault_get_ai_key", {
    p_provedor: provedor,
  });
  if (erroChave || !chave) {
    return Response.json(
      { error: "Chave de API não configurada para esse provedor. Configure em Configurações → IA." },
      { status: 400 }
    );
  }

  const contexto = await montarContexto(supabase);
  const systemPrompt = montarSystemPrompt();
  const userPromptOriginal = montarUserPrompt(contexto, tipoAcao, pedidoUsuario, propostaAnterior);

  const chamarProvider = (prompt: string) =>
    provedor === "claude"
      ? gerarComClaude(chave, modelo, systemPrompt, prompt)
      : gerarComGemini(chave, modelo, systemPrompt, prompt);

  let resultado: TreinoGerado | null = null;
  let respostaBruta: unknown = null;
  let erroFinal: string | null = null;
  let tokensEntrada = 0;
  let tokensSaida = 0;
  let promptAtual = userPromptOriginal;

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const r = await chamarProvider(promptAtual);
      respostaBruta = r.dados;
      tokensEntrada += r.tokensEntrada;
      tokensSaida += r.tokensSaida;

      const parsed = TreinoGeradoSchema.safeParse(r.dados);
      if (parsed.success) {
        resultado = parsed.data;
        break;
      }

      erroFinal = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      promptAtual = `${userPromptOriginal}\n\nATENÇÃO: sua resposta anterior não seguiu o formato exigido (${erroFinal}). Corrija e responda de novo seguindo exatamente o schema.`;
    } catch (e) {
      erroFinal = e instanceof Error ? e.message : String(e);
    }
  }

  const { data: geracao } = await supabase
    .from("geracoes_ia")
    .insert({
      provedor,
      modelo,
      tipo_acao: tipoAcao,
      prompt_enviado: { system: systemPrompt, user: userPromptOriginal },
      resposta_bruta: respostaBruta as never,
      tokens_entrada: tokensEntrada,
      tokens_saida: tokensSaida,
      sucesso: !!resultado,
      erro: resultado ? null : erroFinal,
    })
    .select("id")
    .single();

  if (!resultado) {
    return Response.json(
      { error: erroFinal ?? "Não foi possível gerar o treino. Tente de novo." },
      { status: 502 }
    );
  }

  return Response.json({ treino: resultado, geracaoId: geracao?.id ?? null });
});
