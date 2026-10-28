"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/offline/db";
import { sincronizar } from "@/lib/offline/sync";
import { sair } from "../actions";

// Limpa o IndexedDB antes de deslogar: sem isso, outra conta no mesmo aparelho
// leria o treinoCache da anterior offline. Tenta sincronizar antes pra não
// perder séries pendentes.
async function sairLimpando() {
  try {
    await sincronizar();
  } catch {}
  const pendentes = await db.seriesLocais.filter((x) => !x.sincronizada).count();
  if (pendentes > 0 && !confirm(`Há ${pendentes} série(s) ainda não sincronizada(s) (sem internet?). Se sair agora, elas serão perdidas. Sair mesmo assim?`)) return;
  await Promise.all([db.treinoCache.clear(), db.sessoesLocais.clear(), db.seriesLocais.clear()]);
  await sair();
}

export function SairButton() {
  return (
    <form action={sairLimpando}>
      <Button type="submit" variant="outline">
        Sair
      </Button>
    </form>
  );
}
