"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarAnamnese, type SalvarAnamneseState } from "./actions";
import { NIVEL_LABEL, LOCAL_TREINO_LABEL, SEXO_LABEL, type AnamneseInput } from "@/lib/perfil/schema";

const INITIAL_STATE: SalvarAnamneseState = { error: null, success: false };

export function AnamneseForm({ anamnese }: { anamnese: AnamneseInput | null }) {
  const [state, formAction, pending] = useActionState(salvarAnamnese, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="idade">Idade</Label>
          <Input id="idade" name="idade" type="number" defaultValue={anamnese?.idade} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="altura_cm">Altura (cm)</Label>
          <Input id="altura_cm" name="altura_cm" type="number" defaultValue={anamnese?.altura_cm} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="peso_inicial_kg">Peso (kg)</Label>
          <Input
            id="peso_inicial_kg"
            name="peso_inicial_kg"
            type="number"
            step="0.1"
            defaultValue={anamnese?.peso_inicial_kg}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sexo">Sexo biológico (opcional)</Label>
          <Select name="sexo" defaultValue={anamnese?.sexo ?? undefined}>
            <SelectTrigger id="sexo" className="w-full">
              <SelectValue>{(valor: "masculino" | "feminino") => SEXO_LABEL[valor]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SEXO_LABEL).map(([valor, label]) => (
                <SelectItem key={valor} value={valor}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <span className="text-sm font-medium">Medidas corporais (opcional)</span>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cintura_cm">Cintura (cm)</Label>
            <Input id="cintura_cm" name="cintura_cm" type="number" step="0.1" defaultValue={anamnese?.cintura_cm ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quadril_cm">Quadril (cm)</Label>
            <Input id="quadril_cm" name="quadril_cm" type="number" step="0.1" defaultValue={anamnese?.quadril_cm ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="peito_cm">Peito (cm)</Label>
            <Input id="peito_cm" name="peito_cm" type="number" step="0.1" defaultValue={anamnese?.peito_cm ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="braco_cm">Braço (cm)</Label>
            <Input id="braco_cm" name="braco_cm" type="number" step="0.1" defaultValue={anamnese?.braco_cm ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="coxa_cm">Coxa (cm)</Label>
            <Input id="coxa_cm" name="coxa_cm" type="number" step="0.1" defaultValue={anamnese?.coxa_cm ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pescoco_cm">Pescoço (cm)</Label>
            <Input id="pescoco_cm" name="pescoco_cm" type="number" step="0.1" defaultValue={anamnese?.pescoco_cm ?? ""} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nivel">Nível</Label>
        <Select name="nivel" defaultValue={anamnese?.nivel ?? "intermediario"}>
          <SelectTrigger id="nivel">
            <SelectValue>
              {(valor: AnamneseInput["nivel"]) => NIVEL_LABEL[valor]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NIVEL_LABEL).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input id="objetivo" name="objetivo" defaultValue={anamnese?.objetivo} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dias_disponiveis">Dias/semana</Label>
          <Input
            id="dias_disponiveis"
            name="dias_disponiveis"
            type="number"
            min={1}
            max={7}
            defaultValue={anamnese?.dias_disponiveis}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="local_treino">Local</Label>
          <Select name="local_treino" defaultValue={anamnese?.local_treino ?? "academia"}>
            <SelectTrigger id="local_treino">
              <SelectValue>
                {(valor: AnamneseInput["local_treino"]) => LOCAL_TREINO_LABEL[valor]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOCAL_TREINO_LABEL).map(([valor, label]) => (
                <SelectItem key={valor} value={valor}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="meta_peso_kg">Peso-alvo (kg, opcional)</Label>
          <Input
            id="meta_peso_kg"
            name="meta_peso_kg"
            type="number"
            step="0.1"
            defaultValue={anamnese?.meta_peso_kg ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="meta_prazo">Prazo (opcional)</Label>
          <Input id="meta_prazo" name="meta_prazo" type="date" defaultValue={anamnese?.meta_prazo ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lesoes">Lesões (opcional)</Label>
        <Textarea id="lesoes" name="lesoes" defaultValue={anamnese?.lesoes ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={anamnese?.observacoes ?? ""} />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Perfil salvo.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
