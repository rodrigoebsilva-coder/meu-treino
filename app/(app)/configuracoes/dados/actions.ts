"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ExportDadosSchema, type ExportDados } from "@/lib/dados/schema";

export type ImportarState = { erro: string | null; sucesso: boolean };

export async function importarDados(_prev: ImportarState, formData: FormData): Promise<ImportarState> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return { erro: "Selecione um arquivo .json.", sucesso: false };
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(await arquivo.text());
  } catch {
    return { erro: "Arquivo inválido — não é um JSON válido.", sucesso: false };
  }

  const parsed = ExportDadosSchema.safeParse(bruto);
  if (!parsed.success) {
    return { erro: "Arquivo não está no formato esperado de export do Meu Treino.", sucesso: false };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sessão expirada. Faça login novamente.", sucesso: false };
  }

  try {
    await aplicarImportacao(supabase, userData.user.id, parsed.data);
  } catch (e) {
    return {
      erro: `Falha no meio da importação (${e instanceof Error ? e.message : "erro desconhecido"}). Alguns dados podem ter ficado parcialmente importados — confira antes de tentar de novo.`,
      sucesso: false,
    };
  }

  revalidatePath("/", "layout");
  return { erro: null, sucesso: true };
}

// Não é atômico (mesma decisão de risco aceito de `aprovarTreino`): pra um
// app de usuário único, uma sequência de inserts é mais simples que montar
// uma RPC transacional, e se falhar no meio dá pra arrumar via SQL.
async function aplicarImportacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dados: ExportDados
) {
  const mapaExercicio = new Map<string, string>();
  for (const ex of dados.exercicios_usuario) {
    const { data: novo, error } = await supabase
      .from("exercicios")
      .insert({
        user_id: userId,
        origem: "usuario",
        nome: ex.nome,
        grupo_muscular: ex.grupo_muscular,
        equipamento: ex.equipamento,
        youtube_url: ex.youtube_url,
        imagem_url: ex.imagem_url,
        dica_casa: ex.dica_casa,
      })
      .select("id")
      .single();
    if (error || !novo) throw new Error(`exercício "${ex.nome}"`);
    mapaExercicio.set(ex.id, novo.id);
  }

  const { data: idsExercicios } = await supabase.from("exercicios").select("id");
  const idsExercValidos = new Set((idsExercicios ?? []).map((e) => e.id));

  const { count: temAtivo } = await supabase
    .from("treinos")
    .select("id", { count: "exact", head: true })
    .eq("status", "ativo");
  const treinosAtivosNoImport = dados.treinos.filter((t) => t.status === "ativo").length;
  // Só restaura o status "ativo" original se não houver conflito: nenhum
  // treino ativo hoje e exatamente um candidato no arquivo — do contrário
  // todo treino importado entra arquivado, pra nunca trocar o treino em uso
  // silenciosamente nem esbarrar na unique constraint de "um ativo por vez".
  const podeRestaurarAtivo = !temAtivo && treinosAtivosNoImport === 1;

  const mapaTreinoDia = new Map<string, string>();
  const mapaTreinoExercicio = new Map<string, string>();

  for (const treino of dados.treinos) {
    const status = treino.status === "ativo" && podeRestaurarAtivo ? "ativo" : "arquivado";
    const { data: novoTreino, error: erroTreino } = await supabase
      .from("treinos")
      .insert({
        user_id: userId,
        nome_ciclo: treino.nome_ciclo,
        status,
        origem: treino.origem,
        justificativa_ia: treino.justificativa_ia,
        criado_em: treino.criado_em,
        arquivado_em: status === "arquivado" ? (treino.arquivado_em ?? new Date().toISOString()) : null,
        duracao_semanas: treino.duracao_semanas,
      })
      .select("id")
      .single();
    if (erroTreino || !novoTreino) throw new Error(`treino "${treino.nome_ciclo}"`);

    for (const dia of treino.dias) {
      const { data: novoDia, error: erroDia } = await supabase
        .from("treino_dias")
        .insert({
          user_id: userId,
          treino_id: novoTreino.id,
          ordem: dia.ordem,
          nome: dia.nome,
          grupos_musculares: dia.grupos_musculares,
        })
        .select("id")
        .single();
      if (erroDia || !novoDia) throw new Error(`dia "${dia.nome}"`);
      mapaTreinoDia.set(dia.id, novoDia.id);

      for (const ex of dia.exercicios) {
        const exercicioIdRemapeado = ex.exercicio_id ? (mapaExercicio.get(ex.exercicio_id) ?? ex.exercicio_id) : null;
        const exercicioIdFinal =
          exercicioIdRemapeado && idsExercValidos.has(exercicioIdRemapeado) ? exercicioIdRemapeado : null;

        const { data: novoExercicio, error: erroExercicio } = await supabase
          .from("treino_exercicios")
          .insert({
            user_id: userId,
            treino_dia_id: novoDia.id,
            exercicio_id: exercicioIdFinal,
            nome_exercicio_sugerido: exercicioIdFinal ? ex.nome_exercicio_sugerido : (ex.exercicio_nome ?? ex.nome_exercicio_sugerido),
            ordem: ex.ordem,
            series: ex.series,
            repeticoes_min: ex.repeticoes_min,
            repeticoes_max: ex.repeticoes_max,
            carga_sugerida_kg: ex.carga_sugerida_kg,
            descanso_segundos: ex.descanso_segundos,
            metodo: ex.metodo,
            observacao: ex.observacao,
          })
          .select("id")
          .single();
        if (erroExercicio || !novoExercicio) throw new Error("exercício do treino");
        mapaTreinoExercicio.set(ex.id, novoExercicio.id);
      }
    }
  }

  for (const sessao of dados.sessoes) {
    const treinoDiaId = sessao.treino_dia_id ? (mapaTreinoDia.get(sessao.treino_dia_id) ?? null) : null;
    const { data: novaSessao, error: erroSessao } = await supabase
      .from("sessoes")
      .insert({
        user_id: userId,
        treino_dia_id: treinoDiaId,
        iniciada_em: sessao.iniciada_em,
        finalizada_em: sessao.finalizada_em,
        duracao_segundos: sessao.duracao_segundos,
        energia: sessao.energia,
        sono: sessao.sono,
        dor: sessao.dor,
        notas: sessao.notas,
      })
      .select("id")
      .single();
    if (erroSessao || !novaSessao) throw new Error("sessão de treino");

    for (const serie of sessao.series) {
      const treinoExercicioId = serie.treino_exercicio_id
        ? (mapaTreinoExercicio.get(serie.treino_exercicio_id) ?? null)
        : null;
      const { error: erroSerie } = await supabase.from("sessao_series").insert({
        user_id: userId,
        sessao_id: novaSessao.id,
        treino_exercicio_id: treinoExercicioId,
        numero_serie: serie.numero_serie,
        carga_real_kg: serie.carga_real_kg,
        repeticoes_real: serie.repeticoes_real,
        rpe: serie.rpe,
        concluida_em: serie.concluida_em,
        origem_offline: false,
      });
      if (erroSerie) throw new Error("série de treino");
    }
  }

  if (dados.medidas.length > 0) {
    const { error: erroMedidas } = await supabase
      .from("medidas")
      .upsert(
        dados.medidas.map((m) => ({ ...m, user_id: userId })),
        { onConflict: "user_id,registrado_em" }
      );
    if (erroMedidas) throw new Error("medidas");
  }

  if (dados.anamneses.length > 0) {
    const { data: ultima } = await supabase
      .from("anamneses")
      .select("versao")
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();
    let proximaVersao = (ultima?.versao ?? 0) + 1;

    for (const anamnese of [...dados.anamneses].sort((a, b) => a.versao - b.versao)) {
      const { error: erroAnamnese } = await supabase.from("anamneses").insert({
        user_id: userId,
        versao: proximaVersao,
        idade: anamnese.idade,
        altura_cm: anamnese.altura_cm,
        peso_inicial_kg: anamnese.peso_inicial_kg,
        nivel: anamnese.nivel,
        lesoes: anamnese.lesoes,
        objetivo: anamnese.objetivo,
        dias_disponiveis: anamnese.dias_disponiveis,
        local_treino: anamnese.local_treino,
        observacoes: anamnese.observacoes,
        meta_peso_kg: anamnese.meta_peso_kg,
        meta_prazo: anamnese.meta_prazo,
        criado_em: anamnese.criado_em,
      });
      if (erroAnamnese) throw new Error("anamnese");
      proximaVersao += 1;
    }
  }
}

export type ApagarState = { erro: string | null };

// Apaga só dado de treino/saúde (anamnese, treinos, histórico de execução,
// medidas, fotos). Não mexe em config_ia/chaves de IA nem na conta — "apagar
// tudo" aqui é "recomeçar o histórico de treino", não "apagar minha conta".
export async function apagarTodosDados(): Promise<ApagarState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }
  const userId = userData.user.id;

  const { data: fotos } = await supabase.from("fotos_progresso").select("storage_path").eq("user_id", userId);
  if (fotos && fotos.length > 0) {
    await supabase.storage.from("fotos-progresso").remove(fotos.map((f) => f.storage_path));
  }

  const tabelas = [
    "sessao_series",
    "sessoes",
    "treino_exercicios",
    "treino_dias",
    "treinos",
    "fotos_progresso",
    "medidas",
    "anamneses",
  ] as const;

  for (const tabela of tabelas) {
    const { error } = await supabase.from(tabela).delete().eq("user_id", userId);
    if (error) return { erro: `Não foi possível apagar "${tabela}". Tente de novo.` };
  }

  await supabase.from("exercicios").delete().eq("user_id", userId).eq("origem", "usuario");

  revalidatePath("/", "layout");
  return { erro: null };
}
