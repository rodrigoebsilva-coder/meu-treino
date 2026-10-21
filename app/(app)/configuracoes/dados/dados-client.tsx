"use client";

import { useActionState, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { importarDados, apagarTodosDados, type ImportarState, type ApagarState } from "./actions";

const IMPORTAR_INICIAL: ImportarState = { erro: null, sucesso: false };
const APAGAR_INICIAL: ApagarState = { erro: null };
const FRASE_CONFIRMACAO = "APAGAR";

export function ExportarLink() {
  return (
    <Button variant="outline" render={<a href="/configuracoes/dados/exportar" />} nativeButton={false}>
      <Download /> Exportar meus dados (.json)
    </Button>
  );
}

export function ImportarForm() {
  const [state, formAction, pending] = useActionState(importarDados, IMPORTAR_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="arquivo">Importar de um arquivo exportado antes</Label>
      <Input id="arquivo" name="arquivo" type="file" accept="application/json" required />
      <p className="text-xs text-muted-foreground">
        Treinos importados entram arquivados (seu treino ativo atual não muda, a menos que você não tenha
        nenhum treino ativo agora). Fotos de progresso não fazem parte do export.
      </p>
      {state.erro ? <p className="text-sm text-destructive">{state.erro}</p> : null}
      {state.sucesso ? <p className="text-sm text-emerald-600">Dados importados.</p> : null}
      <Button type="submit" variant="outline" disabled={pending} className="w-fit">
        <Upload /> {pending ? "Importando..." : "Importar"}
      </Button>
    </form>
  );
}

export function ApagarTudoButton() {
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [state, formAction, pending] = useActionState(async (): Promise<ApagarState> => {
    const resultado = await apagarTodosDados();
    if (!resultado.erro) setAberto(false);
    return resultado;
  }, APAGAR_INICIAL);

  return (
    <>
      <Button variant="destructive" onClick={() => setAberto(true)} className="w-fit">
        <Trash2 /> Apagar todos os meus dados
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar todos os dados?</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 text-sm">
            <p>
              Isso apaga permanentemente sua anamnese, treinos, histórico de execução, medidas e fotos de
              progresso. Não dá pra desfazer. Suas configurações de IA e sua conta não são afetadas.
            </p>
            <p>
              Digite <strong>{FRASE_CONFIRMACAO}</strong> pra confirmar.
            </p>
            <Input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoFocus />
            {state.erro ? <p className="text-destructive">{state.erro}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={confirmacao !== FRASE_CONFIRMACAO || pending}
              onClick={() => formAction()}
            >
              {pending ? "Apagando..." : "Apagar tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
