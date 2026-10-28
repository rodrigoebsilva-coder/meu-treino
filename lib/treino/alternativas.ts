import type { SupabaseClient } from "@supabase/supabase-js";

export function escolherAlternativas(
  original: { id: string; grupo_muscular: string; equipamento: string | null; tipo: string },
  candidatos: { id: string; grupo_muscular: string; equipamento: string | null; tipo: string }[],
  excluirIds: Set<string>,
  quantidade = 2
): string[] {
  return candidatos
    .filter((c) => c.id !== original.id && !excluirIds.has(c.id))
    .filter((c) => c.tipo === original.tipo)
    .filter((c) => c.grupo_muscular === original.grupo_muscular)
    .filter((c) => c.equipamento !== original.equipamento)
    .slice(0, quantidade)
    .map((c) => c.id);
}

// Gera (determinístico, não pela IA) até 2 alternativas por exercício do
// treino que ainda não tem nenhuma — chamado tanto na aprovação de um
// treino novo quanto como backfill/rede de segurança ao abrir /treino.
// Pula exercícios sem exercicio_id (sugestão customizada da IA, sem linha
// na tabela exercicios pra comparar grupo/equipamento).
export async function gerarAlternativasParaTreino(supabase: SupabaseClient, treinoId: string): Promise<void> {
  const { data: treinoDias } = await supabase.from("treino_dias").select("id").eq("treino_id", treinoId);
  const diaIds = (treinoDias ?? []).map((d) => d.id);
  if (diaIds.length === 0) return;

  const { data: treinoExercicios } = await supabase
    .from("treino_exercicios")
    .select("id, treino_dia_id, exercicio_id, treino_exercicio_alternativas(id)")
    .in("treino_dia_id", diaIds);

  const pendentes = (treinoExercicios ?? []).filter(
    (te) => te.exercicio_id && te.treino_exercicio_alternativas.length === 0
  );
  if (pendentes.length === 0) return;

  const { data: exercicios } = await supabase.from("exercicios").select("id, grupo_muscular, equipamento, tipo");
  if (!exercicios) return;
  const exerciciosPorId = new Map(exercicios.map((e) => [e.id, e]));

  const exerciciosPorDia = new Map<string, Set<string>>();
  for (const te of treinoExercicios ?? []) {
    if (!te.exercicio_id) continue;
    const set = exerciciosPorDia.get(te.treino_dia_id) ?? new Set<string>();
    set.add(te.exercicio_id);
    exerciciosPorDia.set(te.treino_dia_id, set);
  }

  const linhasNovas: { user_id: string; treino_exercicio_id: string; exercicio_id: string; ordem: number }[] = [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  for (const te of pendentes) {
    const original = exerciciosPorId.get(te.exercicio_id!);
    if (!original) continue;
    const excluir = exerciciosPorDia.get(te.treino_dia_id) ?? new Set<string>();
    const alternativas = escolherAlternativas(original, exercicios, excluir);
    alternativas.forEach((exercicioId, i) => {
      linhasNovas.push({
        user_id: userData.user.id,
        treino_exercicio_id: te.id,
        exercicio_id: exercicioId,
        ordem: i + 1,
      });
    });
  }

  if (linhasNovas.length > 0) {
    await supabase.from("treino_exercicio_alternativas").insert(linhasNovas);
  }
}
