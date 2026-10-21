import { z } from "zod";

export const MedidaSchema = z.object({
  registrado_em: z.string().date(),
  peso_kg: z.coerce.number().min(20).max(400).optional(),
  cintura_cm: z.coerce.number().min(20).max(300).optional(),
  peito_cm: z.coerce.number().min(20).max(300).optional(),
  braco_cm: z.coerce.number().min(10).max(100).optional(),
});

export type MedidaInput = z.infer<typeof MedidaSchema>;
