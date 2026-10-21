"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removerMedida } from "./actions";

interface Medida {
  id: string;
  registrado_em: string;
  peso_kg: number | null;
  cintura_cm: number | null;
  peito_cm: number | null;
  braco_cm: number | null;
}

export function MedidasList({ medidas }: { medidas: Medida[] }) {
  const [removendo, setRemovendo] = useState<string | null>(null);

  async function remover(id: string) {
    setRemovendo(id);
    await removerMedida(id);
    setRemovendo(null);
  }

  if (medidas.length === 0) {
    return <p className="text-muted-foreground">Nenhuma medida registrada ainda.</p>;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-4">
        {medidas.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0">
            <span className="font-medium">
              {new Date(m.registrado_em + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
            <span className="text-muted-foreground">
              {m.peso_kg ? `${m.peso_kg}kg` : ""}
              {m.cintura_cm ? ` · cintura ${m.cintura_cm}cm` : ""}
              {m.peito_cm ? ` · peito ${m.peito_cm}cm` : ""}
              {m.braco_cm ? ` · braço ${m.braco_cm}cm` : ""}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remover"
              disabled={removendo === m.id}
              onClick={() => remover(m.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
