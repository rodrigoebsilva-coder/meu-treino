import { z } from "zod";

export const DadosSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  telefone: z.string().trim().max(30).optional(),
});

export type DadosInput = z.infer<typeof DadosSchema>;

export const CARGO_LABEL: Record<"admin" | "professor" | "aluno", string> = {
  admin: "Admin",
  professor: "Professor",
  aluno: "Aluno",
};
