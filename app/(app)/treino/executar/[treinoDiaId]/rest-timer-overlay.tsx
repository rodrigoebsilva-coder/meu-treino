"use client";

import { Button } from "@/components/ui/button";

const RAIO = 120;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export function RestTimerOverlay({
  restante,
  duracaoTotal,
  onEstender,
  onReduzir,
  onPular,
}: {
  restante: number;
  duracaoTotal: number;
  onEstender: () => void;
  onReduzir: () => void;
  onPular: () => void;
}) {
  const progresso = duracaoTotal > 0 ? restante / duracaoTotal : 0;
  const offset = CIRCUNFERENCIA * (1 - progresso);
  const minutos = String(Math.floor(restante / 60)).padStart(2, "0");
  const segundos = String(restante % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background p-6">
      <p className="text-lg text-muted-foreground">Descansando...</p>

      <div className="relative flex items-center justify-center">
        <svg width={280} height={280} viewBox="0 0 280 280" className="-rotate-90">
          <circle cx={140} cy={140} r={RAIO} fill="none" stroke="var(--border)" strokeWidth={12} />
          <circle
            cx={140}
            cy={140}
            r={RAIO}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute font-mono text-5xl font-semibold">
          {minutos}:{segundos}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={onReduzir} disabled={restante <= 15}>
          -15s
        </Button>
        <Button variant="outline" size="lg" onClick={onEstender}>
          +15s
        </Button>
        <Button variant="secondary" size="lg" onClick={onPular}>
          Pular
        </Button>
      </div>
    </div>
  );
}
