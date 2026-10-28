import type { SupabaseClient } from "@supabase/supabase-js";

export async function montarContexto(supabase: SupabaseClient) {
  const { data: anamnese } = await supabase.from("anamnese_atual").select("*").maybeSingle();

  const { data: treinoAtivo } = await supabase
    .from("treinos")
    .select(
      "id, nome_ciclo, criado_em, treino_dias(ordem, nome, grupos_musculares, treino_exercicios(ordem, series, repeticoes_min, repeticoes_max, carga_sugerida_kg, descanso_segundos, metodo, exercicio:exercicios(id, nome, grupo_muscular)))"
    )
    .eq("status", "ativo")
    .order("ordem", { referencedTable: "treino_dias", ascending: true })
    .maybeSingle();

  const { data: treinosAnteriores } = await supabase
    .from("treinos")
    .select("nome_ciclo, criado_em, arquivado_em")
    .eq("status", "arquivado")
    .order("arquivado_em", { ascending: false })
    .limit(3);

  const { data: sessoesRecentes } = await supabase
    .from("sessoes")
    .select(
      "iniciada_em, finalizada_em, duracao_segundos, energia, sono, dor, notas, sessao_series(numero_serie, carga_real_kg, repeticoes_real, rpe, treino_exercicio_id, exercicio_realizado_id)"
    )
    .not("finalizada_em", "is", null)
    .order("iniciada_em", { ascending: false })
    .limit(10);

  const { data: medidas } = await supabase
    .from("medidas")
    .select("registrado_em, peso_kg, cintura_cm, peito_cm, braco_cm")
    .order("registrado_em", { ascending: false })
    .limit(5);

  const { data: catalogoExercicios } = await supabase
    .from("exercicios")
    .select("id, nome, grupo_muscular, equipamento")
    .order("nome", { ascending: true })
    .limit(250);

  return { anamnese, treinoAtivo, treinosAnteriores, sessoesRecentes, medidas, catalogoExercicios: catalogoExercicios ?? [] };
}

export type Contexto = Awaited<ReturnType<typeof montarContexto>>;
