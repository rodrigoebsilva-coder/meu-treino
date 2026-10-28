"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { preferenciasTimer } from "@/lib/preferencias/timer";

export function TimerToggles() {
  const [som, setSom] = useState(preferenciasTimer.getSom);
  const [vibracao, setVibracao] = useState(preferenciasTimer.getVibracao);
  const [descanso, setDescanso] = useState(() => preferenciasTimer.getDescanso()?.toString() ?? "");

  function salvarDescanso(valor: string) {
    setDescanso(valor);
    preferenciasTimer.setDescanso(valor.trim() === "" ? null : Math.max(0, Number(valor)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span>Tempo de descanso (s)</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            placeholder="do plano"
            value={descanso}
            onChange={(e) => salvarDescanso(e.target.value)}
            className="w-28"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[30, 45, 60, 90, 120, 180].map((s) => (
            <Button key={s} type="button" size="sm" variant={descanso === String(s) ? "default" : "outline"} onClick={() => salvarDescanso(String(s))}>
              {s}s
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => salvarDescanso("")}>
            Usar o do plano
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Vale para todos os exercícios neste aparelho. Vazio = usa o descanso definido em cada exercício do treino.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span>Som ao fim do descanso</span>
        <Switch
          checked={som}
          onCheckedChange={(v) => {
            setSom(!!v);
            preferenciasTimer.setSom(!!v);
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span>Vibração ao fim do descanso</span>
        <Switch
          checked={vibracao}
          onCheckedChange={(v) => {
            setVibracao(!!v);
            preferenciasTimer.setVibracao(!!v);
          }}
        />
      </div>
    </div>
  );
}
