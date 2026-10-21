import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function normalizarMesAno(ano: number, mes: number) {
  const data = new Date(ano, mes - 1, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() + 1 };
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const hoje = new Date();
  const { ano, mes } = normalizarMesAno(
    Number(params.ano) || hoje.getFullYear(),
    Number(params.mes) || hoje.getMonth() + 1
  );

  const inicio = new Date(ano, mes - 1, 1).toISOString();
  const fim = new Date(ano, mes, 1).toISOString();

  const supabase = await createClient();
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id, iniciada_em, duracao_segundos, treino_dias(nome), sessao_series(id)")
    .gte("iniciada_em", inicio)
    .lt("iniciada_em", fim)
    .order("iniciada_em", { ascending: true });

  const diasComTreino = new Set((sessoes ?? []).map((s) => new Date(s.iniciada_em).getDate()));
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const anterior = normalizarMesAno(ano, mes - 1);
  const proximo = normalizarMesAno(ano, mes + 1);

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Histórico 📅</h1>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`/treino/historico?ano=${anterior.ano}&mes=${anterior.mes}`} />}
          nativeButton={false}
        >
          <ChevronLeft />
        </Button>
        <span className="font-medium">
          {MESES[mes - 1]} {ano}
        </span>
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`/treino/historico?ano=${proximo.ano}&mes=${proximo.mes}`} />}
          nativeButton={false}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="text-muted-foreground">
            {d}
          </span>
        ))}
        {celulas.map((dia, i) => (
          <div
            key={i}
            className={
              dia && diasComTreino.has(dia)
                ? "rounded-md bg-primary py-1 text-primary-foreground"
                : "py-1"
            }
          >
            {dia ?? ""}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {(sessoes ?? []).length === 0 ? (
          <p className="text-muted-foreground">Nenhum treino neste mês.</p>
        ) : (
          sessoes!.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{s.treino_dias?.nome ?? "Treino"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(s.iniciada_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      weekday: "short",
                    })}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{s.sessao_series.length} séries</p>
                  {s.duracao_segundos ? (
                    <p>
                      {Math.floor(s.duracao_segundos / 60)}min
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
