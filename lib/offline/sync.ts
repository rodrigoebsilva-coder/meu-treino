import { db } from "./db";
import { createClient } from "@/lib/supabase/client";

// Fila "escreve local primeiro": cada sessão/série criada offline (ou
// online, tanto faz — sempre passa pelo Dexie) é empurrada pro Supabase aqui.
// Usuário único, sem dispositivos concorrentes: não há conflito real a
// resolver, só "ainda não sincronizado" -> "sincronizado".
//
// sincronizar() é chamada de três lugares (montar o layout, evento "online",
// depois de cada série/treino concluído) — sem essa trava, duas chamadas
// simultâneas podem ver a mesma sessão local com idRemoto nulo e criar duas
// linhas remotas pra ela. Só uma rodada roda por vez; chamadas que chegam
// nesse meio-tempo agendam mais uma rodada ao final, em vez de rodar em
// paralelo.
let emAndamento = false;
let rodadaPendente = false;

export async function sincronizar() {
  if (emAndamento) {
    rodadaPendente = true;
    return;
  }
  emAndamento = true;
  try {
    await sincronizarUmaVez();
    while (rodadaPendente) {
      rodadaPendente = false;
      await sincronizarUmaVez();
    }
  } finally {
    emAndamento = false;
  }
}

// Sessão iniciada e nunca finalizada vira "abandonada" depois disso: sem séries é cancelada,
// com séries é encerrada na hora da última série (o cronômetro não fica rodando pra sempre).
export const LIMITE_SESSAO_ABERTA_MS = 5 * 60 * 60 * 1000;

export function sessaoAbandonada(s: { finalizadaEm: string | null; iniciadaEm: string }) {
  return !s.finalizadaEm && Date.now() - new Date(s.iniciadaEm).getTime() > LIMITE_SESSAO_ABERTA_MS;
}

async function resolverSessoesAbandonadas(supabase: ReturnType<typeof createClient>) {
  const abandonadas = await db.sessoesLocais.filter(sessaoAbandonada).toArray();

  for (const s of abandonadas) {
    const series = await db.seriesLocais.where("sessaoIdLocal").equals(s.idLocal).filter((x) => !x.removida).toArray();

    if (series.length === 0) {
      if (s.idRemoto) {
        const { error } = await supabase.from("sessoes").delete().eq("id", s.idRemoto);
        if (error) continue;
      }
      await db.seriesLocais.where("sessaoIdLocal").equals(s.idLocal).delete();
      await db.sessoesLocais.delete(s.idLocal);
      continue;
    }

    const ultima = series.reduce((a, b) => (a.concluidaEm > b.concluidaEm ? a : b)).concluidaEm;
    await db.sessoesLocais.update(s.idLocal, {
      finalizadaEm: ultima,
      duracaoSegundos: Math.max(0, Math.floor((new Date(ultima).getTime() - new Date(s.iniciadaEm).getTime()) / 1000)),
      sincronizada: false,
    });
  }
}

async function sincronizarUmaVez() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const supabase = createClient();
  await resolverSessoesAbandonadas(supabase);
  const sessoes = await db.sessoesLocais.toArray();

  for (const sessao of sessoes) {
    let idRemoto = sessao.idRemoto;

    if (!idRemoto) {
      const { data, error } = await supabase
        .from("sessoes")
        .upsert(
          {
            id: sessao.idLocal,
            treino_dia_id: sessao.treinoDiaId,
            iniciada_em: sessao.iniciadaEm,
            finalizada_em: sessao.finalizadaEm,
            duracao_segundos: sessao.duracaoSegundos,
            energia: sessao.energia,
            sono: sessao.sono,
            dor: sessao.dor,
            notas: sessao.notas,
          },
          { onConflict: "id" }
        )
        .select("id")
        .single();
      if (error || !data) continue;
      idRemoto = data.id;
      await db.sessoesLocais.update(sessao.idLocal, {
        idRemoto,
        sincronizada: Boolean(sessao.finalizadaEm),
      });
    } else if (sessao.finalizadaEm && !sessao.sincronizada) {
      const { error } = await supabase
        .from("sessoes")
        .update({ finalizada_em: sessao.finalizadaEm, duracao_segundos: sessao.duracaoSegundos })
        .eq("id", idRemoto);
      if (!error) {
        await db.sessoesLocais.update(sessao.idLocal, { sincronizada: true });
      }
    }

    const series = await db.seriesLocais
      .where("sessaoIdLocal")
      .equals(sessao.idLocal)
      .filter((s) => !s.sincronizada)
      .toArray();

    for (const serie of series) {
      if (serie.removida) {
        const { error } = await supabase.from("sessao_series").delete().eq("id", serie.idLocal);
        if (!error) await db.seriesLocais.delete(serie.idLocal);
        continue;
      }
      const { error } = await supabase.from("sessao_series").upsert(
        {
          id: serie.idLocal,
          sessao_id: idRemoto,
          treino_exercicio_id: serie.treinoExercicioId,
          numero_serie: serie.numeroSerie,
          carga_real_kg: serie.cargaRealKg,
          repeticoes_real: serie.repeticoesReal,
          rpe: serie.rpe,
          concluida_em: serie.concluidaEm,
          origem_offline: true,
          exercicio_realizado_id: serie.exercicioRealizadoId,
        },
        { onConflict: "id" }
      );
      if (!error) {
        await db.seriesLocais.update(serie.idLocal, { sincronizada: true });
      }
    }
  }

  // Limpeza preventiva: expurga sessões e séries sincronizadas há mais de 7 dias
  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const antigasSincronizadas = await db.sessoesLocais
      .filter((s) => s.sincronizada && s.finalizadaEm !== null && s.finalizadaEm < seteDiasAtras)
      .toArray();

    for (const s of antigasSincronizadas) {
      await db.seriesLocais.where("sessaoIdLocal").equals(s.idLocal).delete();
      await db.sessoesLocais.delete(s.idLocal);
    }
  } catch {
    // Falhas de expurgo não bloqueiam a sincronização
  }
}
