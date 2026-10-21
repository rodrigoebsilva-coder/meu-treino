"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarMedida, type MedidaState } from "./actions";

const INICIAL: MedidaState = { erro: null, sucesso: false };

function hojeISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function MedidaForm() {
  const [state, formAction, pending] = useActionState(salvarMedida, INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="registrado_em">Data</Label>
        <Input id="registrado_em" name="registrado_em" type="date" defaultValue={hojeISO()} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="peso_kg">Peso (kg)</Label>
          <Input id="peso_kg" name="peso_kg" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cintura_cm">Cintura (cm)</Label>
          <Input id="cintura_cm" name="cintura_cm" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="peito_cm">Peito (cm)</Label>
          <Input id="peito_cm" name="peito_cm" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="braco_cm">Braço (cm)</Label>
          <Input id="braco_cm" name="braco_cm" type="number" step="0.1" />
        </div>
      </div>

      {state.erro ? <p className="text-sm text-destructive">{state.erro}</p> : null}
      {state.sucesso ? <p className="text-sm text-emerald-600">Salvo.</p> : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
