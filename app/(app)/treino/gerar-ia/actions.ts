"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TreinoGeradoSchema, type TreinoGerado, type TipoAcao } from "@/lib/ai/schemas";
import type { ProvedorIA } from "@/lib/ai/provider";

export type GerarState = {
  erro: string | null;
  treino: TreinoGerado | null;
  geracaoId: string | null;
};

const INICIAL: GerarState = { erro: null, treino: null, geracaoId: null };

export async function gerarTreinoIA(_prev: GerarState, formData: FormData): Promise<GerarState> {
  const provedor = formData.get("provedor") as ProvedorIA;
  const modelo = String(formData.get("modelo") ?? "");
  const tipoAcao = formData.get("tipoAcao") as TipoAcao;
  const pedidoUsuario = String(formData.get("pedidoUsuario") ?? "");
  const propostaAnteriorRaw = formData.get("propostaAnterior");

  if (!provedor || !modelo || !tipoAcao) {
    return { ...INICIAL, erro: "Selecione provedor, modelo e tipo de ação." };
  }

  const supabase = await createClient();
  const body: Record<string, unknown> = { provedor, modelo, tipoAcao, pedidoUsuario };
  if (typeof propostaAnteriorRaw === "string" && propostaAnteriorRaw) {
    body.propostaAnterior = JSON.parse(propostaAnteriorRaw);
  }

  const { data, error } = await supabase.functions.invoke("gerar-treino", { body });

  if (error) {
    return { ...INICIAL, erro: "Não foi possível gerar o treino. Verifique a chave em Configurações → IA e tente de novo." };
  }

  const parsed = TreinoGeradoSchema.safeParse(data?.treino);
  if (!parsed.success) {
    return { ...INICIAL, erro: "A IA retornou algo em formato inesperado. Tente de novo." };
  }

  return { erro: null, treino: parsed.data, geracaoId: data.geracaoId };
}

export type AprovarState = { erro: string | null };

export async function aprovarTreino(
  treino: TreinoGerado,
  provedor: ProvedorIA,
  geracaoId: string,
  duracaoSemanasNovoCiclo: number | null
): Promise<AprovarState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  // Mesociclo: "ajustar"/"progressão"/"adaptar" continuam o relógio do ciclo
  // atual (herdam duração e data de início do treino que está sendo
  // substituído) — só "novo_ciclo" (duracaoSemanasNovoCiclo não-nulo) reseta
  // o início do mesociclo pra agora.
  const { data: treinoAnterior } = await supabase
    .from("treinos")
    .select("criado_em, duracao_semanas")
    .eq("status", "ativo")
    .maybeSingle();

  // Só pode existir um treino `ativo` por vez — arquiva o atual antes de
  // criar o novo (nessa ordem, por causa da unique constraint).
  const { error: erroArquivar } = await supabase
    .from("treinos")
    .update({ status: "arquivado", arquivado_em: new Date().toISOString() })
    .eq("status", "ativo");
  if (erroArquivar) {
    return { erro: "Não foi possível arquivar o treino anterior." };
  }

  const duracaoSemanas = duracaoSemanasNovoCiclo ?? treinoAnterior?.duracao_semanas ?? 12;
  const criadoEm = duracaoSemanasNovoCiclo != null || !treinoAnterior ? new Date().toISOString() : treinoAnterior.criado_em;

  const { data: novoTreino, error: erroTreino } = await supabase
    .from("treinos")
    .insert({
      nome_ciclo: treino.nome_ciclo,
      status: "ativo",
      origem: provedor,
      geracao_ia_id: geracaoId,
      justificativa_ia: treino.justificativa,
      duracao_semanas: duracaoSemanas,
      criado_em: criadoEm,
    })
    .select("id")
    .single();
  if (erroTreino || !novoTreino) {
    return { erro: "Não foi possível criar o novo treino." };
  }

  for (const dia of treino.dias) {
    const { data: novoDia, error: erroDia } = await supabase
      .from("treino_dias")
      .insert({
        treino_id: novoTreino.id,
        ordem: dia.ordem,
        nome: dia.nome,
        grupos_musculares: dia.grupos_musculares,
      })
      .select("id")
      .single();
    if (erroDia || !novoDia) {
      return { erro: `Não foi possível criar o dia "${dia.nome}".` };
    }

    for (const ex of dia.exercicios) {
      let exercicioId = ex.exercicio_id;

      if (!exercicioId) {
        const { data: novoExercicio, error: erroExercicio } = await supabase
          .from("exercicios")
          .insert({
            user_id: userData.user.id,
            origem: "usuario",
            nome: ex.nome_exercicio_sugerido!,
            grupo_muscular: dia.grupos_musculares[0] ?? "outro",
          })
          .select("id")
          .single();
        if (erroExercicio || !novoExercicio) {
          return { erro: `Não foi possível criar o exercício "${ex.nome_exercicio_sugerido}".` };
        }
        exercicioId = novoExercicio.id;
      }

      const { error: erroTreinoExercicio } = await supabase.from("treino_exercicios").insert({
        treino_dia_id: novoDia.id,
        exercicio_id: exercicioId,
        ordem: ex.ordem,
        series: ex.series,
        repeticoes_min: ex.repeticoes_min,
        repeticoes_max: ex.repeticoes_max,
        carga_sugerida_kg: ex.carga_sugerida_kg,
        descanso_segundos: ex.descanso_segundos,
        metodo: ex.metodo,
        observacao: ex.observacao ?? null,
      });
      if (erroTreinoExercicio) {
        return { erro: "Não foi possível salvar um exercício do treino." };
      }
    }
  }

  revalidatePath("/treino");
  revalidatePath("/");
  return { erro: null };
}
