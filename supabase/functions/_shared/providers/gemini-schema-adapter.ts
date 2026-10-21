// Converte o JSON Schema que o zod gera (z.toJSONSchema) para o subconjunto
// de OpenAPI 3.0 que a Gemini API aceita em generationConfig.responseSchema:
// tipos em MAIÚSCULO, "nullable" como booleano (não union de tipos), e só as
// chaves que a Gemini entende — qualquer coisa fora disso (default, $schema,
// additionalProperties...) é descartada de propósito.

interface JsonSchemaNode {
  type?: string | string[];
  anyOf?: JsonSchemaNode[];
  enum?: string[];
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  [chave: string]: unknown;
}

interface EsquemaGemini {
  type: string;
  nullable?: boolean;
  enum?: string[];
  items?: EsquemaGemini;
  properties?: Record<string, EsquemaGemini>;
  required?: string[];
}

const TIPO_PARA_GEMINI: Record<string, string> = {
  object: "OBJECT",
  array: "ARRAY",
  string: "STRING",
  number: "NUMBER",
  integer: "INTEGER",
  boolean: "BOOLEAN",
};

export function paraEsquemaGemini(schema: JsonSchemaNode): EsquemaGemini {
  // nullable pode vir como type:["x","null"] ou anyOf com um ramo {type:"null"}
  if (Array.isArray(schema.type)) {
    const tipoReal = schema.type.find((t) => t !== "null") ?? "string";
    const base = paraEsquemaGemini({ ...schema, type: tipoReal });
    return { ...base, nullable: schema.type.includes("null") };
  }

  if (schema.anyOf) {
    const ramoNulo = schema.anyOf.some((s) => s.type === "null");
    const ramoReal = schema.anyOf.find((s) => s.type !== "null");
    if (ramoReal) {
      return { ...paraEsquemaGemini(ramoReal), nullable: ramoNulo };
    }
  }

  const tipo = typeof schema.type === "string" ? schema.type : "string";
  const resultado: EsquemaGemini = { type: TIPO_PARA_GEMINI[tipo] ?? "STRING" };

  if (schema.enum) resultado.enum = schema.enum;
  if (schema.items) resultado.items = paraEsquemaGemini(schema.items);
  if (schema.properties) {
    resultado.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([chave, valor]) => [chave, paraEsquemaGemini(valor)])
    );
    resultado.required = schema.required ?? [];
  }

  return resultado;
}
