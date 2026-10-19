"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, type SerieLocal } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";
import { sincronizar } from "@/lib/offline/sync";
import { extrairYoutubeId, type TreinoDiaCompleto } from "@/lib/treino/types";
import { useRestTimer } from "./use-rest-timer";

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
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  const descanso = useRestTimer();

  // Carrega o dia do cache local (funciona offline) e garante uma sessão
  // local — reaproveita uma sessão já iniciada se a página foi recarregada
  // no meio do treino.
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
        });
        setSessaoIdLocal(idLocal);
        setIniciadaEm(agora);
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
    const serie: SerieLocal = {
      idLocal: crypto.randomUUID(),
      sessaoIdLocal,
      treinoExercicioId,
      numeroSerie,
      cargaRealKg: v?.carga ? Number(v.carga) : null,
      repeticoesReal: v?.reps ? Number(v.reps) : null,
      rpe: v?.rpe ? Number(v.rpe) : null,
      concluidaEm: new Date().toISOString(),
      sincronizada: false,
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

  const exercicioComVideo = useMemo(
    () => dia?.treino_exercicios.find((e) => e.id === videoAberto) ?? null,
    [dia, videoAberto]
  );

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dia.nome}</h1>
        <span className="font-mono text-sm text-muted-foreground">
          {minutos}:{segundos}
        </span>
      </div>

      {dia.treino_exercicios.map((ex) => {
        const youtubeId = extrairYoutubeId(ex.exercicio?.youtube_url ?? null);
        return (
          <Card key={ex.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{ex.exercicio?.nome ?? ex.nome_exercicio_sugerido}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={!youtubeId}
                onClick={() => setVideoAberto(ex.id)}
              >
                <Play /> {youtubeId ? "Como executar" : "Vídeo não cadastrado"}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
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
        <div className="sticky bottom-20 z-10 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg">
          <span>Descansando...</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg">
              {String(Math.floor(descanso.restante / 60)).padStart(2, "0")}:
              {String(descanso.restante % 60).padStart(2, "0")}
            </span>
            <Button variant="secondary" size="sm" onClick={descanso.cancelar}>
              Pular
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!videoAberto} onOpenChange={(aberto) => !aberto && setVideoAberto(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{exercicioComVideo?.exercicio?.nome}</DialogTitle>
          </DialogHeader>
          {exercicioComVideo ? (
            <iframe
              className="aspect-video w-full rounded-md"
              src={`https://www.youtube.com/embed/${extrairYoutubeId(exercicioComVideo.exercicio?.youtube_url ?? null)}`}
              title="Como executar"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
