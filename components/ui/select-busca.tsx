"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { filtrarPorBusca } from "@/lib/busca";
import { cn } from "@/lib/utils";

export type ItemBusca = { value: string; label: string; detalhe?: string };

// Lista com busca: digitar filtra na hora e tolera erro de digitação ("supino inclinado", "supno").
export function SelectBusca({
  itens,
  value,
  onValueChange,
  placeholder = "Escolha",
  titulo = "Buscar",
  name,
  id,
  className,
}: {
  itens: ItemBusca[];
  value: string;
  onValueChange: (valor: string) => void;
  placeholder?: string;
  titulo?: string;
  name?: string;
  id?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [consulta, setConsulta] = useState("");

  const selecionado = itens.find((i) => i.value === value);
  const filtrados = filtrarPorBusca(itens, consulta, (i) => `${i.label} ${i.detalhe ?? ""}`).slice(0, 80);

  function escolher(valor: string) {
    onValueChange(valor);
    setAberto(false);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        id={id}
        type="button"
        onClick={() => {
          setConsulta("");
          setAberto(true);
        }}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          !selecionado && "text-muted-foreground",
          className
        )}
      >
        <span className="line-clamp-1">{selecionado?.label ?? placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85dvh]">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Digite para pesquisar..."
              className="h-10 pl-8"
            />
          </div>
          <div className="flex max-h-[50dvh] flex-col gap-1 overflow-y-auto">
            {filtrados.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nada encontrado para &ldquo;{consulta}&rdquo;.</p>
            ) : (
              filtrados.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => escolher(i.value)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-accent active:bg-accent",
                    i.value === value && "bg-accent font-medium"
                  )}
                >
                  <span>{i.label}</span>
                  {i.detalhe ? <span className="text-xs text-muted-foreground">{i.detalhe}</span> : null}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
