import { z } from "zod";

export const AnamneseSchema = z.object({
  idade: z.coerce.number().int().min(10).max(100),
  altura_cm: z.coerce.number().min(100).max(250),
  peso_inicial_kg: z.coerce.number().min(30).max(300),
  nivel: z.enum(["iniciante", "intermediario", "avancado"]),
  lesoes: z.string().trim().max(2000).optional(),
  objetivo: z.string().trim().min(1).max(500),
  dias_disponiveis: z.coerce.number().int().min(1).max(7),
  local_treino: z.enum(["academia", "casa", "hibrido"]),
  observacoes: z.string().trim().max(2000).optional(),
});

export type AnamneseInput = z.infer<typeof AnamneseSchema>;

export const NIVEL_LABEL: Record<AnamneseInput["nivel"], string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const LOCAL_TREINO_LABEL: Record<AnamneseInput["local_treino"], string> = {
  academia: "Academia",
  casa: "Casa",
  hibrido: "Híbrido",
};
