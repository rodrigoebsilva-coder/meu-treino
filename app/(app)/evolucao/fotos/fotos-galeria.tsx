"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removerFoto } from "./actions";

interface Foto {
  id: string;
  storage_path: string;
  registrado_em: string;
  url: string | null;
}

export function FotosGaleria({ fotos }: { fotos: Foto[] }) {
  const [removendo, setRemovendo] = useState<string | null>(null);

  async function remover(foto: Foto) {
    setRemovendo(foto.id);
    await removerFoto(foto.id, foto.storage_path);
    setRemovendo(null);
  }

  if (fotos.length === 0) {
    return <p className="text-muted-foreground">Nenhuma foto ainda.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {fotos.map((foto) => (
        <div key={foto.id} className="relative aspect-square overflow-hidden rounded-md border">
          {foto.url ? (
            <Image src={foto.url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              indisponível
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-white">
            <span>{new Date(foto.registrado_em + "T00:00:00").toLocaleDateString("pt-BR")}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remover"
              disabled={removendo === foto.id}
              onClick={() => remover(foto)}
            >
              <Trash2 className="text-white" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
