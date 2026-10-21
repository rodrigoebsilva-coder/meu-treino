import { z } from "zod";
import { TreinoGeradoSchema } from "../schemas.ts";
import { paraEsquemaGemini } from "./gemini-schema-adapter.ts";
import type { ResultadoProvider } from "./claude.ts";

const ESQUEMA_GEMINI = paraEsquemaGemini(
  z.toJSONSchema(TreinoGeradoSchema, { reused: "inline" }) as Parameters<typeof paraEsquemaGemini>[0]
);

export async function gerarComGemini(
  apiKey: string,
  modelo: string,
  systemPrompt: string,
  userPrompt: string
): Promise<ResultadoProvider> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMA_GEMINI },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;

  return {
    dados: texto ? JSON.parse(texto) : null,
    tokensEntrada: data.usageMetadata?.promptTokenCount ?? 0,
    tokensSaida: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export async function listarModelosGemini(apiKey: string): Promise<{ id: string; nome: string }[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);

  if (!res.ok) {
    throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.models as Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }>)
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => ({ id: m.name.replace(/^models\//, ""), nome: m.displayName ?? m.name }));
}
