"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PontoPeso } from "@/lib/evolucao/dados";

function formatarData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function PesoChart({ pontos }: { pontos: PontoPeso[] }) {
  if (pontos.length < 2) {
    return <p className="text-sm text-muted-foreground">Registre o peso em pelo menos dois dias para ver o gráfico.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={pontos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="data"
          tickFormatter={formatarData}
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          unit="kg"
        />
        <Tooltip
          labelFormatter={(label) => formatarData(String(label))}
          formatter={(value) => [`${value}kg`, "Peso"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="peso" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
