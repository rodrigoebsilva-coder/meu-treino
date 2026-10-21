import type { SupabaseClient } from "@supabase/supabase-js";

export interface SessaoRelatorio {
  id: string;
  iniciada_em: string;
  duracao_segundos: number | null;
  nome_dia: string;
  numero_series: number;
  energia: number | null;
  sono: number | null;
}

export interface MedidaRelatorio {
  registrado_em: string;
  peso_kg: number | null;
  cintura_cm: number | null;
  peito_cm: number | null;
  braco_cm: number | null;
}

export interface DadosRelatorio {
  periodoInicio: string;
  periodoFim: string;
  nomeCiclo: string | null;
  treinosRealizados: number;
  seriesTotais: number;
  volumeTotalKg: number;
  duracaoTotalSegundos: number;
  pesoInicialKg: number | null;
  pesoAtualKg: number | null;
  sessoes: SessaoRelatorio[];
  medidas: MedidaRelatorio[];
}

// Período do relatório: desde o início do ciclo ativo (ou, sem ciclo ativo,
// os últimos 90 dias) até hoje — assim o relatório sempre reflete o bloco de
// treino em andamento, não uma janela fixa arbitrária.
export async function buscarDadosRelatorio(supabase: SupabaseClient): Promise<DadosRelatorio> {
  const { data: treino } = await supabase
    .from("treinos")
    .select("nome_ciclo, criado_em")
    .eq("status", "ativo")
    .maybeSingle();

  const periodoInicio = treino?.criado_em ?? new Date(Date.now() - 90 * 86_400_000).toISOString();
  const periodoFim = new Date().toISOString();

  const [{ data: sessoesBrutas }, { data: anamnese }, { data: medidas }] = await Promise.all([
    supabase
      .from("sessoes")
      .select("id, iniciada_em, duracao_segundos, energia, sono, treino_dias(nome), sessao_series(id, carga_real_kg, repeticoes_real)")
      .gte("iniciada_em", periodoInicio)
      .not("finalizada_em", "is", null)
      .order("iniciada_em", { ascending: true }),
    supabase.from("anamnese_atual").select("peso_inicial_kg").maybeSingle(),
    supabase
      .from("medidas")
      .select("registrado_em, peso_kg, cintura_cm, peito_cm, braco_cm")
      .gte("registrado_em", periodoInicio.slice(0, 10))
      .order("registrado_em", { ascending: true }),
  ]);

  const sessoes: SessaoRelatorio[] = (sessoesBrutas ?? []).map((s) => {
    const treinoDia = Array.isArray(s.treino_dias) ? s.treino_dias[0] : s.treino_dias;
    return {
      id: s.id,
      iniciada_em: s.iniciada_em,
      duracao_segundos: s.duracao_segundos,
      nome_dia: treinoDia?.nome ?? "Treino",
      numero_series: s.sessao_series.length,
      energia: s.energia,
      sono: s.sono,
    };
  });

  const seriesTotais = sessoes.reduce((acc, s) => acc + s.numero_series, 0);
  const duracaoTotalSegundos = sessoes.reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0);
  const volumeTotalKg = (sessoesBrutas ?? []).reduce((acc, s) => {
    const volumeSessao = s.sessao_series.reduce((a: number, serie: { carga_real_kg: number | null; repeticoes_real: number | null }) => {
      if (serie.carga_real_kg == null || serie.repeticoes_real == null) return a;
      return a + serie.carga_real_kg * serie.repeticoes_real;
    }, 0);
    return acc + volumeSessao;
  }, 0);

  const medidasList: MedidaRelatorio[] = medidas ?? [];
  const pesoAtualKg = [...medidasList].reverse().find((m) => m.peso_kg != null)?.peso_kg ?? null;

  return {
    periodoInicio,
    periodoFim,
    nomeCiclo: treino?.nome_ciclo ?? null,
    treinosRealizados: sessoes.length,
    seriesTotais,
    volumeTotalKg: Math.round(volumeTotalKg),
    duracaoTotalSegundos,
    pesoInicialKg: anamnese?.peso_inicial_kg ?? null,
    pesoAtualKg,
    sessoes,
    medidas: medidasList,
  };
}
