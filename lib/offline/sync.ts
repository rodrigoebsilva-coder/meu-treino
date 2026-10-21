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

async function sincronizarUmaVez() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const supabase = createClient();
  const sessoes = await db.sessoesLocais.toArray();

  for (const sessao of sessoes) {
    let idRemoto = sessao.idRemoto;

    if (!idRemoto) {
      const { data, error } = await supabase
        .from("sessoes")
        .insert({
          treino_dia_id: sessao.treinoDiaId,
          iniciada_em: sessao.iniciadaEm,
          energia: sessao.energia,
          sono: sessao.sono,
          dor: sessao.dor,
          notas: sessao.notas,
        })
        .select("id")
        .single();
      if (error || !data) continue;
      idRemoto = data.id;
      await db.sessoesLocais.update(sessao.idLocal, { idRemoto });
    }

    if (sessao.finalizadaEm && !sessao.sincronizada) {
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
      const { error } = await supabase.from("sessao_series").insert({
        sessao_id: idRemoto,
        treino_exercicio_id: serie.treinoExercicioId,
        numero_serie: serie.numeroSerie,
        carga_real_kg: serie.cargaRealKg,
        repeticoes_real: serie.repeticoesReal,
        rpe: serie.rpe,
        concluida_em: serie.concluidaEm,
        origem_offline: true,
      });
      if (!error) {
        await db.seriesLocais.update(serie.idLocal, { sincronizada: true });
      }
    }
  }
}
