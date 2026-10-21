"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { gerarTreinoIA, type GerarState } from "./actions";
import { TIPO_ACAO, TIPO_ACAO_LABEL, type TipoAcao, type TreinoGerado } from "@/lib/ai/schemas";
import type { ProvedorIA, ModeloDisponivel } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/client";
import { DiffPreview } from "./diff-preview";

const INICIAL: GerarState = { erro: null, treino: null, geracaoId: null };

const PROVEDOR_LABEL: Record<ProvedorIA, string> = { claude: "Claude", gemini: "Gemini" };

export function GerarForm({
  provedorPadrao,
  modeloPadrao,
  temTreinoAtivo,
  exerciciosPorId,
  tipoAcaoInicial,
  onDescartar,
}: {
  provedorPadrao: ProvedorIA;
  modeloPadrao: string;
  temTreinoAtivo: boolean;
  exerciciosPorId: Record<string, string>;
  tipoAcaoInicial?: TipoAcao;
  onDescartar: () => void;
}) {
  const [tipoAcao, setTipoAcao] = useState<TipoAcao>(tipoAcaoInicial ?? (temTreinoAtivo ? "ajustar" : "novo_ciclo"));
  const [duracaoSemanas, setDuracaoSemanas] = useState(12);
  const [provedor, setProvedor] = useState<ProvedorIA>(provedorPadrao);
  const [modelo, setModelo] = useState(modeloPadrao);
  const [modelos, setModelos] = useState<ModeloDisponivel[] | null>(null);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [erroModelos, setErroModelos] = useState<string | null>(null);
  const [propostaAnterior, setPropostaAnterior] = useState<TreinoGerado | null>(null);
  const [modoAjuste, setModoAjuste] = useState(false);

  const [state, formAction, gerando] = useActionState(gerarTreinoIA, INICIAL);

  async function trocarProvedor(novo: ProvedorIA) {
    setProvedor(novo);
    setErroModelos(null);
    if (novo === provedorPadrao) {
      setModelo(modeloPadrao);
      setModelos(null);
      return;
    }
    setCarregandoModelos(true);
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("listar-modelos", {
      body: { provedor: novo },
    });
    setCarregandoModelos(false);
    if (error || !data?.modelos?.length) {
      setErroModelos("Configure a chave desse provedor em Configurações → IA primeiro.");
      setModelos(null);
      setModelo("");
      return;
    }
    setModelos(data.modelos);
    setModelo(data.modelos[0].id);
  }

  const mostrandoPreview = !!state.treino && !modoAjuste;

  if (mostrandoPreview) {
    return (
      <DiffPreview
        treino={state.treino!}
        provedor={provedor}
        geracaoId={state.geracaoId!}
        exerciciosPorId={exerciciosPorId}
        onAjustar={() => {
          setPropostaAnterior(state.treino);
          setTipoAcao("ajustar");
          setModoAjuste(true);
        }}
        onDescartar={onDescartar}
        duracaoSemanas={tipoAcao === "novo_ciclo" ? duracaoSemanas : null}
      />
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setModoAjuste(false)}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="provedor" value={provedor} readOnly />
      <input type="hidden" name="modelo" value={modelo} readOnly />
      <input type="hidden" name="tipoAcao" value={tipoAcao} readOnly />
      {propostaAnterior ? (
        <input type="hidden" name="propostaAnterior" value={JSON.stringify(propostaAnterior)} readOnly />
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Tipo de ação</Label>
        <div className="flex flex-wrap gap-2">
          {TIPO_ACAO.map((acao) => (
            <button
              key={acao}
              type="button"
              onClick={() => setTipoAcao(acao)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                tipoAcao === acao ? "border-primary bg-primary text-primary-foreground" : "border-border"
              )}
            >
              {TIPO_ACAO_LABEL[acao]}
            </button>
          ))}
        </div>
      </div>

      {tipoAcao === "novo_ciclo" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="duracaoSemanas">Duração do mesociclo (semanas)</Label>
          <Input
            id="duracaoSemanas"
            type="number"
            min={1}
            max={52}
            value={duracaoSemanas}
            onChange={(e) => setDuracaoSemanas(Number(e.target.value) || 1)}
            className="w-24"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="pedidoUsuario">
          {modoAjuste ? "O que você quer ajustar na proposta?" : "Algum pedido específico? (opcional)"}
        </Label>
        <Textarea
          id="pedidoUsuario"
          name="pedidoUsuario"
          placeholder="Ex.: quero focar mais em posterior, só tenho 45 min por dia essa semana..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="provedor-select">Provedor</Label>
          <Select value={provedor} onValueChange={(v) => v && trocarProvedor(v as ProvedorIA)}>
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

        {modelos ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="modelo-select">Modelo</Label>
            <Select value={modelo} onValueChange={(v) => v && setModelo(v)}>
              <SelectTrigger id="modelo-select" className="w-full">
                <SelectValue>{(v: string) => modelos.find((m) => m.id === v)?.nome ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>Modelo</Label>
            <p className="pt-2 text-sm text-muted-foreground">
              {carregandoModelos ? "Carregando..." : modelo || "nenhum"}
            </p>
          </div>
        )}
      </div>

      {erroModelos ? <p className="text-sm text-destructive">{erroModelos}</p> : null}
      {state.erro ? <p className="text-sm text-destructive">{state.erro}</p> : null}

      <Button type="submit" disabled={gerando || !modelo}>
        {gerando ? "Gerando..." : "Gerar"}
      </Button>
    </form>
  );
}
