import { z } from "zod";
import { TreinoGeradoSchema } from "../schemas.ts";

const TREINO_TOOL = {
  name: "retornar_treino",
  description: "Retorna o treino gerado/ajustado no formato exigido.",
  input_schema: z.toJSONSchema(TreinoGeradoSchema, { reused: "inline" }) as Record<string, unknown>,
};

export interface ResultadoProvider {
  dados: unknown;
  tokensEntrada: number;
  tokensSaida: number;
}

export async function gerarComClaude(
  apiKey: string,
  modelo: string,
  systemPrompt: string,
  userPrompt: string
): Promise<ResultadoProvider> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [TREINO_TOOL],
      // Modelos mais novos (ex.: Sonnet 5.5) rejeitam tool_choice forçado
      // ("tool"/"any") com 400 — não é suportado quando o modelo pode usar
      // extended thinking. "auto" funciona em todos os modelos; como só
      // existe essa tool e o system prompt já instrui a sempre usá-la, o
      // modelo chama de qualquer forma na prática (bug real, encontrado
      // testando em produção com claude-sonnet-5-5).
      tool_choice: { type: "auto" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const toolUse = (data.content as Array<{ type: string; input?: unknown }> | undefined)?.find(
    (c) => c.type === "tool_use"
  );

  return {
    dados: toolUse?.input,
    tokensEntrada: data.usage?.input_tokens ?? 0,
    tokensSaida: data.usage?.output_tokens ?? 0,
  };
}

export async function listarModelosClaude(apiKey: string): Promise<{ id: string; nome: string }[]> {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.data as Array<{ id: string; display_name?: string }>).map((m) => ({
    id: m.id,
    nome: m.display_name ?? m.id,
  }));
}
