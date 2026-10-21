import { createClient } from "@/lib/supabase/server";
import type { ExportDados } from "@/lib/dados/schema";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [{ data: anamneses }, { data: exerciciosUsuario }, { data: treinos }, { data: sessoes }, { data: medidas }] =
    await Promise.all([
      supabase
        .from("anamneses")
        .select(
          "versao, idade, altura_cm, peso_inicial_kg, nivel, lesoes, objetivo, dias_disponiveis, local_treino, observacoes, meta_peso_kg, meta_prazo, criado_em"
        )
        .order("versao", { ascending: true }),
      supabase
        .from("exercicios")
        .select("id, nome, grupo_muscular, equipamento, youtube_url, imagem_url, dica_casa")
        .eq("origem", "usuario"),
      supabase
        .from("treinos")
        .select(
          "nome_ciclo, status, origem, justificativa_ia, criado_em, arquivado_em, treino_dias(id, ordem, nome, grupos_musculares, treino_exercicios(id, exercicio_id, nome_exercicio_sugerido, ordem, series, repeticoes_min, repeticoes_max, carga_sugerida_kg, descanso_segundos, metodo, observacao, exercicios(nome)))"
        ),
      supabase
        .from("sessoes")
        .select(
          "treino_dia_id, iniciada_em, finalizada_em, duracao_segundos, energia, sono, dor, notas, sessao_series(treino_exercicio_id, numero_serie, carga_real_kg, repeticoes_real, rpe, concluida_em)"
        ),
      supabase
        .from("medidas")
        .select("registrado_em, peso_kg, cintura_cm, peito_cm, braco_cm, outras")
        .order("registrado_em", { ascending: true }),
    ]);

  const dados: ExportDados = {
    versao_formato: 1,
    exportado_em: new Date().toISOString(),
    // `nivel`/`local_treino` são `text` com CHECK no Postgres, não um enum de
    // verdade — o gerador de types não enxerga o union literal, só `string`.
    anamneses: (anamneses ?? []) as ExportDados["anamneses"],
    exercicios_usuario: exerciciosUsuario ?? [],
    treinos: (treinos ?? []).map((t) => ({
      nome_ciclo: t.nome_ciclo,
      status: t.status,
      origem: t.origem,
      justificativa_ia: t.justificativa_ia,
      criado_em: t.criado_em,
      arquivado_em: t.arquivado_em,
      dias: [...t.treino_dias]
        .sort((a, b) => a.ordem - b.ordem)
        .map((d) => ({
          id: d.id,
          ordem: d.ordem,
          nome: d.nome,
          grupos_musculares: d.grupos_musculares,
          exercicios: [...d.treino_exercicios]
            .sort((a, b) => a.ordem - b.ordem)
            .map((e) => {
              const exercicio = Array.isArray(e.exercicios) ? e.exercicios[0] : e.exercicios;
              return {
                id: e.id,
                exercicio_id: e.exercicio_id,
                exercicio_nome: exercicio?.nome ?? null,
                nome_exercicio_sugerido: e.nome_exercicio_sugerido,
                ordem: e.ordem,
                series: e.series,
                repeticoes_min: e.repeticoes_min,
                repeticoes_max: e.repeticoes_max,
                carga_sugerida_kg: e.carga_sugerida_kg,
                descanso_segundos: e.descanso_segundos,
                metodo: e.metodo,
                observacao: e.observacao,
              };
            }),
        })),
    })),
    sessoes: (sessoes ?? []).map((s) => ({
      treino_dia_id: s.treino_dia_id,
      iniciada_em: s.iniciada_em,
      finalizada_em: s.finalizada_em,
      duracao_segundos: s.duracao_segundos,
      energia: s.energia,
      sono: s.sono,
      dor: s.dor,
      notas: s.notas,
      series: s.sessao_series,
    })),
    medidas: medidas ?? [],
  };

  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="meu-treino-dados-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
