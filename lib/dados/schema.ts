import { z } from "zod";

// Formato do export/import de dados (Fase 7 do roteiro trazido da análise do
// mt-rodrigo.netlify.app). Fotos de progresso ficam de fora de propósito —
// são binários no Storage, não dado estruturado; o export é só os dados que
// cabem bem num JSON. `id` em treino_dias/treino_exercicios é só uma chave
// de remapeamento dentro do próprio arquivo (pra ligar sessoes/sessao_series
// aos dias/exercícios certos na hora de importar), nunca reaproveitado como
// id real no banco — ver `atualizar-dados` sobre como o import remapeia.

export const ExercicioUsuarioExportSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  grupo_muscular: z.string(),
  equipamento: z.string().nullable(),
  youtube_url: z.string().nullable(),
  imagem_url: z.string().nullable(),
  dica_casa: z.string().nullable(),
});

export const TreinoExercicioExportSchema = z.object({
  id: z.string().uuid(),
  exercicio_id: z.string().uuid().nullable(),
  exercicio_nome: z.string().nullable(),
  nome_exercicio_sugerido: z.string().nullable(),
  ordem: z.number().int(),
  series: z.number().int(),
  repeticoes_min: z.number().int(),
  repeticoes_max: z.number().int(),
  carga_sugerida_kg: z.number().nullable(),
  descanso_segundos: z.number().int(),
  metodo: z.enum(["normal", "biset", "drop_set", "rest_pause", "piramide"]),
  observacao: z.string().nullable(),
});

export const TreinoDiaExportSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
  nome: z.string(),
  grupos_musculares: z.array(z.string()),
  exercicios: z.array(TreinoExercicioExportSchema),
});

export const TreinoExportSchema = z.object({
  nome_ciclo: z.string(),
  status: z.enum(["ativo", "arquivado", "rascunho_ia"]),
  origem: z.enum(["manual", "claude", "gemini"]),
  justificativa_ia: z.string().nullable(),
  criado_em: z.string(),
  arquivado_em: z.string().nullable(),
  duracao_semanas: z.number().int(),
  dias: z.array(TreinoDiaExportSchema),
});

export const SessaoSerieExportSchema = z.object({
  treino_exercicio_id: z.string().uuid().nullable(),
  numero_serie: z.number().int(),
  carga_real_kg: z.number().nullable(),
  repeticoes_real: z.number().int().nullable(),
  rpe: z.number().int().nullable(),
  concluida_em: z.string(),
  exercicio_realizado_id: z.string().uuid().nullable().optional(),
});

export const SessaoExportSchema = z.object({
  treino_dia_id: z.string().uuid().nullable(),
  iniciada_em: z.string(),
  finalizada_em: z.string().nullable(),
  duracao_segundos: z.number().int().nullable(),
  energia: z.number().int().nullable(),
  sono: z.number().int().nullable(),
  dor: z.string().nullable(),
  notas: z.string().nullable(),
  series: z.array(SessaoSerieExportSchema),
});

export const MedidaExportSchema = z.object({
  registrado_em: z.string(),
  peso_kg: z.number().nullable(),
  cintura_cm: z.number().nullable(),
  peito_cm: z.number().nullable(),
  braco_cm: z.number().nullable(),
  outras: z.unknown().nullable(),
});

export const AnamneseExportSchema = z.object({
  versao: z.number().int(),
  idade: z.number().int(),
  altura_cm: z.number(),
  peso_inicial_kg: z.number(),
  nivel: z.enum(["iniciante", "intermediario", "avancado"]),
  lesoes: z.string().nullable(),
  objetivo: z.string(),
  dias_disponiveis: z.number().int(),
  local_treino: z.enum(["academia", "casa", "hibrido"]),
  observacoes: z.string().nullable(),
  meta_peso_kg: z.number().nullable(),
  meta_prazo: z.string().nullable(),
  sexo: z.enum(["masculino", "feminino"]).nullable().optional(),
  cintura_cm: z.number().nullable().optional(),
  quadril_cm: z.number().nullable().optional(),
  peito_cm: z.number().nullable().optional(),
  braco_cm: z.number().nullable().optional(),
  coxa_cm: z.number().nullable().optional(),
  pescoco_cm: z.number().nullable().optional(),
  criado_em: z.string(),
});

export const ExportDadosSchema = z.object({
  versao_formato: z.literal(1),
  exportado_em: z.string(),
  anamneses: z.array(AnamneseExportSchema),
  exercicios_usuario: z.array(ExercicioUsuarioExportSchema),
  treinos: z.array(TreinoExportSchema),
  sessoes: z.array(SessaoExportSchema),
  medidas: z.array(MedidaExportSchema),
});

export type ExportDados = z.infer<typeof ExportDadosSchema>;
