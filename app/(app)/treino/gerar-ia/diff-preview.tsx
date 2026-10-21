"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aprovarTreino } from "./actions";
import { MUDANCA_LABEL, type TreinoGerado } from "@/lib/ai/schemas";
import type { ProvedorIA } from "@/lib/ai/provider";

export function DiffPreview({
  treino,
  provedor,
  geracaoId,
  exerciciosPorId,
  onAjustar,
  onDescartar,
}: {
  treino: TreinoGerado;
  provedor: ProvedorIA;
  geracaoId: string;
  exerciciosPorId: Record<string, string>;
  onAjustar: () => void;
  onDescartar: () => void;
}) {
  const router = useRouter();
  const [aprovando, setAprovando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aprovar() {
    setAprovando(true);
    setErro(null);
    const res = await aprovarTreino(treino, provedor, geracaoId);
    setAprovando(false);
    if (res.erro) {
      setErro(res.erro);
      return;
    }
    router.push("/treino");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{treino.nome_ciclo}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{treino.justificativa}</p>
          {treino.mudancas.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">O que muda</span>
              {treino.mudancas.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="shrink-0">
                    {MUDANCA_LABEL[m.tipo]}
                  </Badge>
                  <span className="text-muted-foreground">{m.descricao}</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {treino.dias.map((dia) => (
        <Card key={dia.ordem}>
          <CardHeader>
            <CardTitle className="text-base">{dia.nome}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {dia.exercicios.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {ex.exercicio_id ? exerciciosPorId[ex.exercicio_id] ?? "Exercício" : ex.nome_exercicio_sugerido}
                  {!ex.exercicio_id ? <Badge variant="outline" className="ml-2">novo</Badge> : null}
                </span>
                <span className="text-muted-foreground">
                  {ex.series}x{ex.repeticoes_min}-{ex.repeticoes_max}
                  {ex.carga_sugerida_kg ? ` · ${ex.carga_sugerida_kg}kg` : ""} · {ex.descanso_segundos}s
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex gap-2">
        <Button onClick={aprovar} disabled={aprovando}>
          {aprovando ? "Aplicando..." : "Aprovar"}
        </Button>
        <Button variant="outline" onClick={onAjustar} disabled={aprovando}>
          Pedir ajuste
        </Button>
        <Button variant="ghost" onClick={onDescartar} disabled={aprovando}>
          Descartar
        </Button>
      </div>
    </div>
  );
}
