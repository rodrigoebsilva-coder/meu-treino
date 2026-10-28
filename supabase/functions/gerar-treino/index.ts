import { TreinoGeradoSchema, type TipoAcao, type TreinoGerado } from "../_shared/schemas.ts";
import { criarClienteDoUsuario, criarClienteServico } from "../_shared/user-client.ts";
import { gerarComClaude } from "../_shared/providers/claude.ts";
import { gerarComGemini } from "../_shared/providers/gemini.ts";
import { montarContexto } from "./contexto.ts";
import { montarSystemPrompt, montarUserPrompt } from "./prompts.ts";

interface CorpoRequisicao {
  provedor?: "claude" | "gemini";
  modelo?: string;
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

  const { tipoAcao, pedidoUsuario, propostaAnterior } = corpo;
  if (!tipoAcao) {
    return Response.json({ error: "Faltam o tipo de ação." }, { status: 400 });
  }

  const { data: ehAdmin } = await supabase.rpc("sou_admin");
  const servico = criarClienteServico();
  const userId = userData.user.id;

  let provedor: "claude" | "gemini";
  let modelo: string;
  let chave: string;
  let creditoConsumido = false;

  if (ehAdmin) {
    // Admin usa a própria chave, sem limite.
    if (!corpo.provedor || !corpo.modelo) {
      return Response.json({ error: "Faltam provedor ou modelo." }, { status: 400 });
    }
    provedor = corpo.provedor;
    modelo = corpo.modelo;
    const { data, error } = await supabase.rpc("vault_get_ai_key", { p_provedor: provedor });
    if (error || !data) {
      return Response.json(
        { error: "Chave de API não configurada para esse provedor. Configure em Configurações → IA." },
        { status: 400 }
      );
    }
    chave = data;
  } else {
    // Demais usuários: chave e modelo do admin (ignora o que veio no corpo), 1 geração por vez.
    const { data } = await servico.rpc("vault_get_chave_compartilhada");
    const compartilhada = Array.isArray(data) ? data[0] : data;
    if (!compartilhada?.chave || !compartilhada?.modelo) {
      return Response.json({ error: "A IA ainda não foi configurada pelo administrador." }, { status: 503 });
    }
    const { data: ok } = await servico.rpc("consumir_geracao", { p_user_id: userId });
    if (!ok) {
      return Response.json(
        { error: "Você já usou sua geração de treino. Peça ao administrador para liberar outra, ou ajuste seu treino manualmente.", codigo: "sem_creditos" },
        { status: 403 }
      );
    }
    creditoConsumido = true;
    provedor = compartilhada.provedor;
    modelo = compartilhada.modelo;
    chave = compartilhada.chave;
  }

  try {
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
      if (creditoConsumido) await servico.rpc("devolver_geracao", { p_user_id: userId });
      return Response.json(
        { error: erroFinal ?? "Não foi possível gerar o treino. Tente de novo." },
        { status: 502 }
      );
    }

    return Response.json({ treino: resultado, geracaoId: geracao?.id ?? null });
  } catch (e) {
    if (creditoConsumido) await servico.rpc("devolver_geracao", { p_user_id: userId });
    return Response.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status: 500 });
  }
});
