import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { ExercicioResumo } from "@/lib/treino/types";
import {
  buscarPesoHistorico,
  buscarVolumeSemanal,
  buscarFrequenciaSemanal,
  calcularStreak,
} from "@/lib/evolucao/dados";
import { PesoChart } from "./peso-chart";
import { SemanalChart } from "./semanal-chart";
import { CargaExercicioChart } from "./carga-exercicio-chart";

export default async function EvolucaoPage() {
  const supabase = await createClient();

  const [peso, volume, frequencia, streak, planejados, trocados] = await Promise.all([
    buscarPesoHistorico(supabase),
    buscarVolumeSemanal(supabase),
    buscarFrequenciaSemanal(supabase),
    calcularStreak(supabase),
    supabase.from("treino_exercicios").select("exercicio_id").not("exercicio_id", "is", null),
    supabase.from("sessao_series").select("exercicio_realizado_id").not("exercicio_realizado_id", "is", null),
  ]);

  // Só exercícios que já estiveram em algum treino (inclusive arquivados) ou foram feitos via troca.
  const idsUsados = [
    ...new Set([
      ...(planejados.data ?? []).map((r) => r.exercicio_id as string),
      ...(trocados.data ?? []).map((r) => r.exercicio_realizado_id as string),
    ]),
  ];
  const exercicios = idsUsados.length
    ? await supabase
        .from("exercicios")
        .select("id, nome, grupo_muscular, youtube_url, dica_casa")
        .in("id", idsUsados)
        .order("nome", { ascending: true })
        .returns<ExercicioResumo[]>()
    : { data: [] as ExercicioResumo[] };

  return (
    <main className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Evolução 📈</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/evolucao/medidas">Medidas</Link>} nativeButton={false} />
          <Button variant="outline" render={<Link href="/evolucao/fotos">Fotos</Link>} nativeButton={false} />
          <Button variant="outline" render={<Link href="/relatorio">Relatório</Link>} nativeButton={false} />
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-muted-foreground">Streak atual</span>
          <span className="text-3xl font-semibold">
            {streak} {streak === 1 ? "dia" : "dias"}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peso ao longo do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <PesoChart pontos={peso} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volume semanal (kg levantado)</CardTitle>
        </CardHeader>
        <CardContent>
          <SemanalChart pontos={volume} unidade="kg" rotulo="Volume" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequência semanal (treinos)</CardTitle>
        </CardHeader>
        <CardContent>
          <SemanalChart pontos={frequencia} unidade="" rotulo="Treinos" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carga por exercício</CardTitle>
        </CardHeader>
        <CardContent>
          <CargaExercicioChart exerciciosDisponiveis={exercicios.data ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
