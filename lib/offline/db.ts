import Dexie, { type EntityTable } from "dexie";
import type { TreinoCompleto } from "@/lib/treino/types";

export interface TreinoCache {
  id: string; // treino_id
  atualizadoEm: string;
  dados: TreinoCompleto;
}

export interface SessaoLocal {
  idLocal: string; // crypto.randomUUID()
  idRemoto: string | null; // preenchido depois do sync
  treinoDiaId: string;
  iniciadaEm: string;
  finalizadaEm: string | null;
  duracaoSegundos: number | null;
  sincronizada: boolean;
  // Check-in preenchido antes da primeira série (Fase 7) — não é indexado,
  // não precisa subir a versão do Dexie pra adicionar esses campos.
  energia: number | null;
  sono: number | null;
  dor: string | null;
  notas: string | null;
}

export interface SerieLocal {
  idLocal: string;
  sessaoIdLocal: string;
  treinoExercicioId: string;
  numeroSerie: number;
  cargaRealKg: number | null;
  repeticoesReal: number | null;
  rpe: number | null;
  concluidaEm: string;
  sincronizada: boolean;
  // Smart Swap (Fase 13): exercício realmente feito, se diferente do
  // planejado (aparelho ocupado) — null é o caso comum. Não é indexado,
  // não precisa subir a versão do Dexie.
  exercicioRealizadoId: string | null;
}

export const db = new Dexie("meu-treino") as Dexie & {
  treinoCache: EntityTable<TreinoCache, "id">;
  sessoesLocais: EntityTable<SessaoLocal, "idLocal">;
  seriesLocais: EntityTable<SerieLocal, "idLocal">;
};

db.version(1).stores({
  treinoCache: "id",
  sessoesLocais: "idLocal, sincronizada",
  seriesLocais: "idLocal, sessaoIdLocal, sincronizada",
});

// v2: faltou indexar treinoDiaId (precisa pra achar a sessão local em
// andamento de um dia ao recarregar a página de execução).
db.version(2).stores({
  treinoCache: "id",
  sessoesLocais: "idLocal, treinoDiaId, sincronizada",
  seriesLocais: "idLocal, sessaoIdLocal, sincronizada",
});
