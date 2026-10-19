import { z } from "zod";

export const TreinoExercicioEditSchema = z.object({
  exercicio_id: z.string().uuid(),
  series: z.coerce.number().int().min(1).max(20),
  repeticoes_min: z.coerce.number().int().min(1).max(100),
  repeticoes_max: z.coerce.number().int().min(1).max(100),
  carga_sugerida_kg: z.coerce.number().min(0).max(1000).optional(),
  descanso_segundos: z.coerce.number().int().min(0).max(1800),
  metodo: z.enum(["normal", "biset", "drop_set", "rest_pause", "piramide"]),
  observacao: z.string().trim().max(500).optional(),
});

export type TreinoExercicioEditInput = z.infer<typeof TreinoExercicioEditSchema>;
