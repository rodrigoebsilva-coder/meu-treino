"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AlternativaExercicio } from "@/lib/treino/types";

// "Aparelho ocupado?" — Smart Swap: troca só pra sessão de hoje (não edita o
// plano), com as 2 alternativas já calculadas na elaboração do treino.
export function TrocaExercicioButton({
  nomeOriginal,
  alternativas,
  substituicaoAtual,
  onEscolher,
}: {
  nomeOriginal: string;
  alternativas: AlternativaExercicio[];
  substituicaoAtual: string | null;
  onEscolher: (exercicioId: string | null) => void;
}) {
  const [aberto, setAberto] = useState(false);

  if (alternativas.length === 0) return null;

  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Aparelho ocupado? Trocar exercício" onClick={() => setAberto(true)}>
        <RefreshCw />
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Aparelho ocupado?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Troca só vale por hoje — o plano continua com {nomeOriginal}.</p>
          <div className="flex flex-col gap-2">
            {alternativas.map((alt) => (
              <Button
                key={alt.exercicio_id}
                variant={substituicaoAtual === alt.exercicio_id ? "default" : "outline"}
                onClick={() => {
                  onEscolher(alt.exercicio_id);
                  setAberto(false);
                }}
              >
                {alt.nome}
              </Button>
            ))}
            {substituicaoAtual ? (
              <Button
                variant="ghost"
                onClick={() => {
                  onEscolher(null);
                  setAberto(false);
                }}
              >
                Usar o planejado ({nomeOriginal})
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
