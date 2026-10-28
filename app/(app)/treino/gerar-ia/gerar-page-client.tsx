"use client";

import { useState } from "react";
import type { ProvedorIA } from "@/lib/ai/provider";
import type { TipoAcao } from "@/lib/ai/schemas";
import { GerarForm } from "./gerar-form";

export function GerarPageClient({
  provedorPadrao,
  modeloPadrao,
  temTreinoAtivo,
  exerciciosPorId,
  tipoAcaoInicial,
  semanasInicial,
}: {
  provedorPadrao: ProvedorIA;
  modeloPadrao: string;
  temTreinoAtivo: boolean;
  exerciciosPorId: Record<string, string>;
  tipoAcaoInicial?: TipoAcao;
  semanasInicial?: number;
}) {
  // Trocar a `key` remonta o GerarForm do zero — é como "descartar" reseta o
  // useActionState interno dele sem precisar de um método de reset próprio.
  const [geracao, setGeracao] = useState(0);

  return (
    <GerarForm
      key={geracao}
      provedorPadrao={provedorPadrao}
      modeloPadrao={modeloPadrao}
      temTreinoAtivo={temTreinoAtivo}
      exerciciosPorId={exerciciosPorId}
      tipoAcaoInicial={tipoAcaoInicial}
      semanasInicial={semanasInicial}
      onDescartar={() => setGeracao((g) => g + 1)}
    />
  );
}
