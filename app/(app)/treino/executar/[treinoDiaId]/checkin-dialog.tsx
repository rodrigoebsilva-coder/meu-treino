"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

export type CheckinValores = {
  energia: number | null;
  sono: number | null;
  dor: string | null;
  notas: string | null;
};

export function CheckinDialog({
  aberto,
  onConfirmar,
  onPular,
}: {
  aberto: boolean;
  onConfirmar: (valores: CheckinValores) => void;
  onPular: () => void;
}) {
  const [energia, setEnergia] = useState(7);
  const [sono, setSono] = useState(7);
  const [dor, setDor] = useState("");
  const [notas, setNotas] = useState("");

  function confirmar() {
    onConfirmar({
      energia,
      sono,
      dor: dor.trim() || null,
      notas: notas.trim() || null,
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Antes de começar, como você está?</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Energia</Label>
              <span className="font-mono text-sm text-muted-foreground">{energia}</span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[energia]}
              onValueChange={(v) => setEnergia(Array.isArray(v) ? v[0] : v)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Sono</Label>
              <span className="font-mono text-sm text-muted-foreground">{sono}</span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[sono]}
              onValueChange={(v) => setSono(Array.isArray(v) ? v[0] : v)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="checkin-dor">Alguma dor ou desconforto? (opcional)</Label>
            <Input
              id="checkin-dor"
              placeholder="Ex.: joelho direito incomodando"
              value={dor}
              onChange={(e) => setDor(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="checkin-notas">Notas (opcional)</Label>
            <Textarea id="checkin-notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onPular}>
            Pular
          </Button>
          <Button onClick={confirmar}>Começar treino</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
