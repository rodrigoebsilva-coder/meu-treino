import { z } from "zod";

// Fonte única do shape que a IA deve devolver (ver plano da Fase 0/3).
// Importado tanto pela Edge Function `gerar-treino` (Deno, via "zod" mapeado
// em deno.json pra npm:zod@4) quanto pelo Next.js (lib/ai/schemas.ts reexporta
// este arquivo — zod resolve via node_modules do lado de lá). Sem import
// relativo pra outro arquivo daqui: Deno exige extensão .ts em imports
// relativos, então manter este arquivo autocontido evita essa dor de cabeça
// dos dois lados.

export const SerieGeradaSchema = z.object({
  ordem: z.number().int(),
  series: z.number().int().min(1),
  repeticoes_min: z.number().int().min(1),
  repeticoes_max: z.number().int().min(1),
  carga_sugerida_kg: z.number().nullable(),
  descanso_segundos: z.number().int().min(0),
  duracao_minutos: z.number().int().min(1).nullable().optional(),
  metodo: z.enum(["normal", "biset", "drop_set", "rest_pause", "piramide"]).default("normal"),
  observacao: z.string().optional(),
});

export const TreinoExercicioGeradoSchema = SerieGeradaSchema.extend({
  exercicio_id: z.string().uuid().nullable(),
  nome_exercicio_sugerido: z.string().optional(),
}).refine((v) => v.exercicio_id !== null || !!v.nome_exercicio_sugerido, {
  message: "nome_exercicio_sugerido é obrigatório quando exercicio_id é null",
});

export const TreinoDiaGeradoSchema = z.object({
  ordem: z.number().int(),
  nome: z.string().min(1),
  grupos_musculares: z.array(z.string()),
  exercicios: z.array(TreinoExercicioGeradoSchema).min(1),
});

export const MudancaSchema = z.object({
  tipo: z.enum([
    "exercicio_adicionado",
    "exercicio_removido",
    "carga_alterada",
    "series_alteradas",
    "dia_adicionado",
    "dia_removido",
    "outro",
  ]),
  descricao: z.string(),
});

export const TreinoGeradoSchema = z.object({
  nome_ciclo: z.string().min(1),
  dias: z.array(TreinoDiaGeradoSchema).min(1),
  justificativa: z.string(),
  mudancas: z.array(MudancaSchema).default([]),
});

export type TreinoGerado = z.infer<typeof TreinoGeradoSchema>;
export type TreinoDiaGerado = z.infer<typeof TreinoDiaGeradoSchema>;
export type TreinoExercicioGerado = z.infer<typeof TreinoExercicioGeradoSchema>;
export type Mudanca = z.infer<typeof MudancaSchema>;

export const TIPO_ACAO = ["novo_ciclo", "ajustar", "progressao_cargas", "adaptar_casa"] as const;
export type TipoAcao = (typeof TIPO_ACAO)[number];
