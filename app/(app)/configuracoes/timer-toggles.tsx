"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { preferenciasTimer } from "@/lib/preferencias/timer";

export function TimerToggles() {
  const [som, setSom] = useState(preferenciasTimer.getSom);
  const [vibracao, setVibracao] = useState(preferenciasTimer.getVibracao);

  return (
    <div className="flex flex-col gap-4">
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
