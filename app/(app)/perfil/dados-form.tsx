"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarDados, type SalvarDadosState } from "./actions";
import { CARGO_LABEL } from "@/lib/perfil/dados-schema";

const INITIAL_STATE: SalvarDadosState = { error: null, success: false };

export function DadosForm({
  nome,
  dataNascimento,
  telefone,
  email,
  cargo,
}: {
  nome: string | null;
  dataNascimento: string | null;
  telefone: string | null;
  email: string;
  cargo: "admin" | "professor" | "aluno";
}) {
  const [state, formAction, pending] = useActionState(salvarDados, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">E-mail</span>
          <span>{email}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Cargo</span>
          <span>{CARGO_LABEL[cargo]}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" defaultValue={nome ?? ""} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input id="data_nascimento" name="data_nascimento" type="date" defaultValue={dataNascimento ?? ""} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefone">Telefone (opcional)</Label>
          <Input id="telefone" name="telefone" type="tel" defaultValue={telefone ?? ""} />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Dados salvos.</p> : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
