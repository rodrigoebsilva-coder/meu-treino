import type { Database } from "@/types/database.types";

export type Exercicio = Database["public"]["Tables"]["exercicios"]["Row"];
export type TreinoExercicio = Database["public"]["Tables"]["treino_exercicios"]["Row"];
export type TreinoDia = Database["public"]["Tables"]["treino_dias"]["Row"];
export type Treino = Database["public"]["Tables"]["treinos"]["Row"];
export type MetodoSerie = Database["public"]["Enums"]["metodo_serie"];

export type ExercicioResumo = Pick<Exercicio, "id" | "nome" | "grupo_muscular" | "youtube_url" | "dica_casa">;

export type AlternativaExercicio = { exercicio_id: string; nome: string };

export type TreinoExercicioComDados = TreinoExercicio & {
  exercicio: ExercicioResumo | null;
  alternativas: AlternativaExercicio[];
};

export type TreinoDiaCompleto = TreinoDia & {
  treino_exercicios: TreinoExercicioComDados[];
};

export type TreinoCompleto = Treino & {
  treino_dias: TreinoDiaCompleto[];
};

export const METODO_LABEL: Record<MetodoSerie, string> = {
  normal: "Normal",
  biset: "Bi-set",
  drop_set: "Drop set",
  rest_pause: "Rest-pause",
  piramide: "Pirâmide",
};

export function extrairYoutubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

// Sem vídeo curado (youtube_url), busca no YouTube pelo nome do exercício —
// cobre os 876 exercícios do seed sem precisar de curadoria manual.
export function youtubeBuscaUrl(nomeExercicio: string): string {
  const query = `${nomeExercicio} how to exercise`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
