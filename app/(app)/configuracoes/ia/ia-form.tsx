"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectBusca } from "@/components/ui/select-busca";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProvedorIA } from "@/lib/ai/provider";
import { testarChave, salvarConfigIA, type TestarChaveState, type SalvarConfigIAState } from "./actions";

const PROVEDOR_LABEL: Record<ProvedorIA, string> = { claude: "Claude (Anthropic)", gemini: "Gemini (Google)" };

const TESTAR_INICIAL: TestarChaveState = { erro: null, modelos: null };
const SALVAR_INICIAL: SalvarConfigIAState = { erro: null, sucesso: false };

export function IaForm({
  provedorAtual,
  modeloAtual,
  temChaveClaude,
  temChaveGemini,
}: {
  provedorAtual: ProvedorIA;
  modeloAtual: string;
  temChaveClaude: boolean;
  temChaveGemini: boolean;
}) {
  const [provedor, setProvedor] = useState<ProvedorIA>(provedorAtual);
  const [chave, setChave] = useState("");
  const [modeloSelecionado, setModeloSelecionado] = useState(modeloAtual);
  const [teste, testarAction, testando] = useActionState(testarChave, TESTAR_INICIAL);
  const [salvar, salvarAction, salvando] = useActionState(salvarConfigIA, SALVAR_INICIAL);

  const temChaveAtual = provedor === "claude" ? temChaveClaude : temChaveGemini;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="provedor-select">Provedor</Label>
        <Select
          value={provedor}
          onValueChange={(v) => {
            setProvedor(v as ProvedorIA);
            setModeloSelecionado("");
          }}
        >
          <SelectTrigger id="provedor-select" className="w-full">
            <SelectValue>{(v: ProvedorIA) => PROVEDOR_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROVEDOR_LABEL).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form action={testarAction} className="flex flex-col gap-2">
        <input type="hidden" name="provedor" value={provedor} readOnly />
        <Label htmlFor="chave">
          Chave de API {temChaveAtual ? "(já configurada — deixe em branco para manter)" : ""}
        </Label>
        <Input
          id="chave"
          name="chave"
          type="password"
          placeholder={temChaveAtual ? "••••••••" : "sk-..."}
          value={chave}
          onChange={(e) => setChave(e.target.value)}
        />
        {teste.erro ? <p className="text-sm text-destructive">{teste.erro}</p> : null}
        <Button type="submit" variant="outline" disabled={testando} className="w-fit">
          {testando ? "Testando..." : "Testar e listar modelos"}
        </Button>
      </form>

      {teste.modelos ? (
        <form action={salvarAction} className="flex flex-col gap-4">
          <input type="hidden" name="provedor" value={provedor} readOnly />
          <input type="hidden" name="chave" value={chave} readOnly />
          <div className="flex flex-col gap-2">
            <Label htmlFor="modelo-select">Modelo</Label>
            <SelectBusca
              id="modelo-select"
              name="modelo"
              titulo="Escolher modelo"
              value={modeloSelecionado}
              onValueChange={setModeloSelecionado}
              itens={teste.modelos.map((m) => ({ value: m.id, label: m.nome }))}
            />
          </div>
          {salvar.erro ? <p className="text-sm text-destructive">{salvar.erro}</p> : null}
          {salvar.sucesso ? <p className="text-sm text-emerald-600">Salvo.</p> : null}
          <Button type="submit" disabled={salvando || !modeloSelecionado} className="w-fit">
            {salvando ? "Salvando..." : "Salvar como padrão"}
          </Button>
        </form>
      ) : modeloAtual && provedor === provedorAtual ? (
        <p className="text-sm text-muted-foreground">Modelo padrão atual: {modeloAtual}</p>
      ) : null}
    </div>
  );
}
