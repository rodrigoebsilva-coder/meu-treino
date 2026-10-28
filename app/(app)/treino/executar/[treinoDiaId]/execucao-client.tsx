"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { db, type SerieLocal } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";
import { sincronizar } from "@/lib/offline/sync";
import { type TreinoDiaCompleto } from "@/lib/treino/types";
import { useRestTimer } from "./use-rest-timer";
import { RestTimerOverlay } from "./rest-timer-overlay";
import { CheckinDialog, type CheckinValores } from "./checkin-dialog";
import { ExercicioVideoButton } from "../../exercicio-video-button";
import { TrocaExercicioButton } from "./troca-exercicio-button";

type Sugestao = { cargaRealKg: number | null; repeticoesReal: number | null };
type ValoresSerie = { carga: string; reps: string; rpe: string };

function chaveSerie(treinoExercicioId: string, numeroSerie: number) {
  return `${treinoExercicioId}:${numeroSerie}`;
}

export function ExecucaoClient({ treinoDiaId, treinoId }: { treinoDiaId: string; treinoId: string }) {
  const [dia, setDia] = useState<TreinoDiaCompleto | null | undefined>(undefined);
  const [sessaoIdLocal, setSessaoIdLocal] = useState<string | null>(null);
  const [iniciadaEm, setIniciadaEm] = useState<string | null>(null);
  const [concluidas, setConcluidas] = useState<Record<string, Sugestao>>({});
  const [sugestoes, setSugestoes] = useState<Record<string, Sugestao>>({});
  const [valores, setValores] = useState<Record<string, ValoresSerie>>({});
  const [finalizada, setFinalizada] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dicaCasaAberta, setDicaCasaAberta] = useState<string | null>(null);
  const [checkinPendente, setCheckinPendente] = useState(false);
  const [substituicoes, setSubstituicoes] = useState<Record<string, string>>({});
  const descanso = useRestTimer();

  async function criarSessao(checkin: CheckinValores) {
    const idLocal = crypto.randomUUID();
    const agora = new Date().toISOString();
    await db.sessoesLocais.add({
      idLocal,
      idRemoto: null,
      treinoDiaId,
      iniciadaEm: agora,
      finalizadaEm: null,
      duracaoSegundos: null,
      sincronizada: false,
      ...checkin,
    });
    setSessaoIdLocal(idLocal);
    setIniciadaEm(agora);
    setCheckinPendente(false);
  }

  // Carrega o dia do cache local (funciona offline) e garante uma sessão
  // local — reaproveita uma sessão já iniciada se a página foi recarregada
  // no meio do treino. Pra uma sessão nova, só cria a sessão depois do
  // check-in (energia/sono/dor/notas) — ver criarSessao().
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const cache = await db.treinoCache.get(treinoId);
      const diaCache = cache?.dados.treino_dias.find((d) => d.id === treinoDiaId) ?? null;
      if (!ativo) return;
      setDia(diaCache);

      const existente = await db.sessoesLocais
        .where("treinoDiaId")
        .equals(treinoDiaId)
        .filter((s) => !s.finalizadaEm)
        .first();

      if (existente) {
        setSessaoIdLocal(existente.idLocal);
        setIniciadaEm(existente.iniciadaEm);
      } else {
        setCheckinPendente(true);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [treinoId, treinoDiaId]);

  // Séries já concluídas localmente (resumo após reload) + sugestão de carga
  // com base na última vez que esse dia foi treinado (melhor esforço, só se
  // online — offline simplesmente não atualiza a sugestão).
  useEffect(() => {
    if (!sessaoIdLocal) return;

    (async () => {
      const series = await db.seriesLocais.where("sessaoIdLocal").equals(sessaoIdLocal).toArray();
      const mapa: Record<string, Sugestao> = {};
      for (const s of series) {
        mapa[chaveSerie(s.treinoExercicioId, s.numeroSerie)] = {
          cargaRealKg: s.cargaRealKg,
          repeticoesReal: s.repeticoesReal,
        };
      }
      setConcluidas(mapa);
    })();

    if (!navigator.onLine) return;

    (async () => {
      const supabase = createClient();
      const { data: ultimaSessao } = await supabase
        .from("sessoes")
        .select("sessao_series(treino_exercicio_id, numero_serie, carga_real_kg, repeticoes_real)")
        .eq("treino_dia_id", treinoDiaId)
        .not("finalizada_em", "is", null)
        .order("iniciada_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ultimaSessao) return;
      const mapa: Record<string, Sugestao> = {};
      for (const s of ultimaSessao.sessao_series) {
        if (!s.treino_exercicio_id) continue;
        mapa[chaveSerie(s.treino_exercicio_id, s.numero_serie)] = {
          cargaRealKg: s.carga_real_kg,
          repeticoesReal: s.repeticoes_real,
        };
      }
      setSugestoes(mapa);
    })();
  }, [sessaoIdLocal, treinoDiaId]);

  // Timer total da sessão (só exibição, não precisa alarmar nada).
  useEffect(() => {
    if (!iniciadaEm) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(iniciadaEm).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [iniciadaEm]);

  function valorAtual(chave: string, campo: keyof ValoresSerie, padrao: string) {
    return valores[chave]?.[campo] ?? padrao;
  }

  function atualizarValor(chave: string, campo: keyof ValoresSerie, valor: string) {
    setValores((prev) => ({ ...prev, [chave]: { ...prev[chave], [campo]: valor } }));
  }

  async function concluirSerie(treinoExercicioId: string, numeroSerie: number, descansoSegundos: number) {
    if (!sessaoIdLocal) return;
    const chave = chaveSerie(treinoExercicioId, numeroSerie);
    const v = valores[chave];
    const sugestao = sugestoes[chave];
    const ex = dia?.treino_exercicios.find((e) => e.id === treinoExercicioId);

    const cargaRealKg =
      v?.carga !== undefined && v.carga.trim() !== ""
        ? Number(v.carga)
        : (sugestao?.cargaRealKg ?? ex?.carga_sugerida_kg ?? null);

    const repeticoesReal =
      v?.reps !== undefined && v.reps.trim() !== ""
        ? Number(v.reps)
        : (sugestao?.repeticoesReal ?? ex?.repeticoes_min ?? null);

    const serie: SerieLocal = {
      idLocal: crypto.randomUUID(),
      sessaoIdLocal,
      treinoExercicioId,
      numeroSerie,
      cargaRealKg,
      repeticoesReal,
      rpe: v?.rpe && v.rpe.trim() !== "" ? Number(v.rpe) : null,
      concluidaEm: new Date().toISOString(),
      sincronizada: false,
      exercicioRealizadoId: substituicoes[treinoExercicioId] ?? null,
    };
    await db.seriesLocais.add(serie);
    setConcluidas((prev) => ({
      ...prev,
      [chave]: { cargaRealKg: serie.cargaRealKg, repeticoesReal: serie.repeticoesReal },
    }));
    descanso.iniciar(descansoSegundos);
    void sincronizar();
  }

  async function concluirTreino() {
    if (!sessaoIdLocal || !iniciadaEm) return;
    const duracaoSegundos = Math.floor((Date.now() - new Date(iniciadaEm).getTime()) / 1000);
    await db.sessoesLocais.update(sessaoIdLocal, {
      finalizadaEm: new Date().toISOString(),
      duracaoSegundos,
    });
    setFinalizada(true);
    void sincronizar();
  }

  const minutos = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const segundos = String(elapsed % 60).padStart(2, "0");

  if (dia === undefined) {
    return <p className="p-6 text-muted-foreground">Carregando...</p>;
  }

  if (dia === null) {
    return (
      <main className="flex flex-col gap-4 p-6">
        <p className="text-muted-foreground">
          Esse treino ainda não está disponível offline. Abra a aba{" "}
          <Link href="/treino" className="underline">
            Treino
          </Link>{" "}
          com internet pelo menos uma vez antes de executar sem conexão.
        </p>
      </main>
    );
  }

  if (finalizada) {
    return (
      <main className="flex flex-col items-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Treino concluído 💪</h1>
        <p className="text-muted-foreground">
          Duração: {minutos}:{segundos}
        </p>
        <Button render={<Link href="/treino">Voltar</Link>} nativeButton={false} />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-6 pb-4">
      <CheckinDialog
        aberto={checkinPendente}
        onConfirmar={criarSessao}
        onPular={() => criarSessao({ energia: null, sono: null, dor: null, notas: null })}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dia.nome}</h1>
        <span className="font-mono text-sm text-muted-foreground">
          {minutos}:{segundos}
        </span>
      </div>

      {dia.treino_exercicios.map((ex) => {
        const nomeOriginal = ex.exercicio?.nome ?? ex.nome_exercicio_sugerido ?? "";
        const substitutoId = substituicoes[ex.id] ?? null;
        const substituto = substitutoId ? ex.alternativas.find((a) => a.exercicio_id === substitutoId) : null;
        const nomeExibido = substituto?.nome ?? nomeOriginal;

        return (
          <Card key={ex.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{nomeExibido}</CardTitle>
                {substituto ? <p className="text-xs text-muted-foreground">em vez de {nomeOriginal}</p> : null}
              </div>
              <div className="flex items-center gap-1">
                <TrocaExercicioButton
                  nomeOriginal={nomeOriginal}
                  alternativas={ex.alternativas}
                  substituicaoAtual={substitutoId}
                  onEscolher={(exercicioId) =>
                    setSubstituicoes((prev) => {
                      const novo = { ...prev };
                      if (exercicioId) novo[ex.id] = exercicioId;
                      else delete novo[ex.id];
                      return novo;
                    })
                  }
                />
                <ExercicioVideoButton nome={nomeExibido} youtubeUrl={ex.exercicio?.youtube_url ?? null} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ex.exercicio?.dica_casa ? (
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => setDicaCasaAberta((atual) => (atual === ex.id ? null : ex.id))}
                  >
                    <Home className="size-3.5" /> Alternativa em casa
                  </button>
                  {dicaCasaAberta === ex.id ? (
                    <p className="mt-1 text-sm text-muted-foreground">{ex.exercicio.dica_casa}</p>
                  ) : null}
                </div>
              ) : null}
              {Array.from({ length: ex.series }, (_, i) => i + 1).map((numeroSerie) => {
                const chave = chaveSerie(ex.id, numeroSerie);
                const feita = concluidas[chave];
                const sugestao = sugestoes[chave];
                const cargaPadrao = sugestao?.cargaRealKg?.toString() ?? ex.carga_sugerida_kg?.toString() ?? "";
                const repsPadrao = sugestao?.repeticoesReal?.toString() ?? "";

                return (
                  <div key={chave} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!feita}
                      disabled={!!feita}
                      onCheckedChange={(marcado) => {
                        if (marcado) void concluirSerie(ex.id, numeroSerie, ex.descanso_segundos);
                      }}
                    />
                    <span className="w-6 text-sm text-muted-foreground">#{numeroSerie}</span>
                    <Input
                      className="w-20"
                      type="number"
                      step="0.5"
                      placeholder={cargaPadrao || "kg"}
                      disabled={!!feita}
                      value={feita ? feita.cargaRealKg?.toString() ?? "" : valorAtual(chave, "carga", "")}
                      onChange={(e) => atualizarValor(chave, "carga", e.target.value)}
                    />
                    <Input
                      className="w-16"
                      type="number"
                      placeholder={repsPadrao || `${ex.repeticoes_min}-${ex.repeticoes_max}`}
                      disabled={!!feita}
                      value={feita ? feita.repeticoesReal?.toString() ?? "" : valorAtual(chave, "reps", "")}
                      onChange={(e) => atualizarValor(chave, "reps", e.target.value)}
                    />
                    <Input
                      className="w-16"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="RPE"
                      disabled={!!feita}
                      value={valorAtual(chave, "rpe", "")}
                      onChange={(e) => atualizarValor(chave, "rpe", e.target.value)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Button onClick={concluirTreino} className="mt-2">
        Concluir treino
      </Button>

      {descanso.ativo ? (
        <RestTimerOverlay
          restante={descanso.restante}
          duracaoTotal={descanso.duracaoTotal}
          onEstender={() => descanso.estender(15)}
          onPular={descanso.cancelar}
        />
      ) : null}
    </main>
  );
}
