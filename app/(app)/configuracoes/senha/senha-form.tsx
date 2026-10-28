"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alterarSenha, type AlterarSenhaState } from "./actions";

const INITIAL_STATE: AlterarSenhaState = { error: null, success: false };

export function SenhaForm() {
  const [state, formAction, pending] = useActionState(alterarSenha, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="atual">Senha atual</Label>
        <Input id="atual" name="atual" type="password" autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nova">Nova senha</Label>
        <Input id="nova" name="nova" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmar">Confirmar nova senha</Label>
        <Input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">Senha alterada com sucesso.</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
