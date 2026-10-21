"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { registrarFoto } from "./actions";

function hojeISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function UploadFoto() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(formData: FormData) {
    const arquivo = inputRef.current?.files?.[0];
    const registradoEm = String(formData.get("registrado_em") ?? hojeISO());

    if (!arquivo) {
      setErro("Escolha uma foto.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErro("Sessão expirada.");
      setEnviando(false);
      return;
    }

    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `${userData.user.id}/${registradoEm}-${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage.from("fotos-progresso").upload(caminho, arquivo);
    if (erroUpload) {
      setErro("Não foi possível enviar a foto.");
      setEnviando(false);
      return;
    }

    const res = await registrarFoto(caminho, registradoEm);
    setEnviando(false);
    if (res.erro) {
      setErro(res.erro);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="registrado_em">Data</Label>
        <Input id="registrado_em" name="registrado_em" type="date" defaultValue={hojeISO()} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="arquivo">Foto</Label>
        <Input id="arquivo" ref={inputRef} type="file" accept="image/*" />
      </div>
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}
