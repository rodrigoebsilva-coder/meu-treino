"use client";

import { useState } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExercicioResumo } from "@/lib/treino/types";
import { buscarHistoricoCarga } from "./actions";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function CargaExercicioChart({ exerciciosDisponiveis }: { exerciciosDisponiveis: ExercicioResumo[] }) {
  const [exercicioId, setExercicioId] = useState<string>("");
  const [pontos, setPontos] = useState<{ data: string; carga: number }[] | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function selecionar(id: string) {
    setExercicioId(id);
    setCarregando(true);
    const dados = await buscarHistoricoCarga(id);
    setPontos(dados);
    setCarregando(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <Select value={exercicioId} onValueChange={(v) => v && selecionar(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Escolha um exercício">
            {(v: string) => exerciciosDisponiveis.find((e) => e.id === v)?.nome ?? "Escolha um exercício"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {exerciciosDisponiveis.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {carregando ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

      {!carregando && pontos && pontos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem séries registradas para esse exercício ainda.</p>
      ) : null}

      {!carregando && pontos && pontos.length > 0 ? (
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
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} unit="kg" />
            <Tooltip
              labelFormatter={(label) => formatarData(String(label))}
              formatter={(value) => [`${value}kg`, "Carga"]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="carga" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
