"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PontoSemanal } from "@/lib/evolucao/dados";

function formatarSemana(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function SemanalChart({
  pontos,
  unidade,
  rotulo,
}: {
  pontos: PontoSemanal[];
  unidade: string;
  rotulo: string;
}) {
  if (pontos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={pontos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="semana"
          tickFormatter={formatarSemana}
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          labelFormatter={(label) => `Semana de ${formatarSemana(String(label))}`}
          formatter={(value) => [`${value}${unidade}`, rotulo]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="valor" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
