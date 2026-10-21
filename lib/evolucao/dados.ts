import type { SupabaseClient } from "@supabase/supabase-js";

export interface PontoPeso {
  data: string;
  peso: number;
}

export async function buscarPesoHistorico(supabase: SupabaseClient): Promise<PontoPeso[]> {
  const { data } = await supabase
    .from("medidas")
    .select("registrado_em, peso_kg")
    .not("peso_kg", "is", null)
    .order("registrado_em", { ascending: true })
    .limit(180);

  return (data ?? []).map((m) => ({ data: m.registrado_em, peso: Number(m.peso_kg) }));
}

function inicioDaSemana(data: Date): string {
  const d = new Date(data);
  const diaSemana = d.getDay();
  d.setDate(d.getDate() - diaSemana);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export interface PontoSemanal {
  semana: string;
  valor: number;
}

export async function buscarVolumeSemanal(supabase: SupabaseClient): Promise<PontoSemanal[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 12 * 7);

  const { data } = await supabase
    .from("sessao_series")
    .select("concluida_em, carga_real_kg, repeticoes_real")
    .gte("concluida_em", desde.toISOString())
    .not("carga_real_kg", "is", null)
    .not("repeticoes_real", "is", null);

  const porSemana = new Map<string, number>();
  for (const s of data ?? []) {
    const semana = inicioDaSemana(new Date(s.concluida_em));
    const volume = Number(s.carga_real_kg) * Number(s.repeticoes_real);
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + volume);
  }

  return Array.from(porSemana.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, valor]) => ({ semana, valor: Math.round(valor) }));
}

export async function buscarFrequenciaSemanal(supabase: SupabaseClient): Promise<PontoSemanal[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 12 * 7);

  const { data } = await supabase
    .from("sessoes")
    .select("iniciada_em")
    .gte("iniciada_em", desde.toISOString())
    .not("finalizada_em", "is", null);

  const porSemana = new Map<string, number>();
  for (const s of data ?? []) {
    const semana = inicioDaSemana(new Date(s.iniciada_em));
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + 1);
  }

  return Array.from(porSemana.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, valor]) => ({ semana, valor }));
}

export async function calcularStreak(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("sessoes")
    .select("iniciada_em")
    .not("finalizada_em", "is", null)
    .order("iniciada_em", { ascending: false })
    .limit(400);

  const dias = new Set((data ?? []).map((s) => new Date(s.iniciada_em).toISOString().slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  // Se ainda não treinou hoje, o streak conta a partir de ontem (treinar hoje
  // mantém o streak, mas o dia de hoje não "quebra" ele antes de acabar).
  if (!dias.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dias.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function buscarCargaExercicio(
  supabase: SupabaseClient,
  exercicioId: string
): Promise<{ data: string; carga: number }[]> {
  const { data } = await supabase
    .from("sessao_series")
    .select("concluida_em, carga_real_kg, treino_exercicios!inner(exercicio_id)")
    .eq("treino_exercicios.exercicio_id", exercicioId)
    .not("carga_real_kg", "is", null)
    .order("concluida_em", { ascending: true })
    .limit(100);

  return (data ?? []).map((s) => ({
    data: s.concluida_em,
    carga: Number(s.carga_real_kg),
  }));
}
