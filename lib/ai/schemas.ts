// Reexporta o schema canônico, que mora em supabase/functions/_shared
// porque a Edge Function `gerar-treino` (Deno) também precisa dele — ver o
// comentário em supabase/functions/_shared/schemas.ts antes de editar.
export * from "@/supabase/functions/_shared/schemas";

import type { Mudanca, TipoAcao } from "@/supabase/functions/_shared/schemas";

export const TIPO_ACAO_LABEL: Record<TipoAcao, string> = {
  novo_ciclo: "Novo ciclo completo",
  ajustar: "Ajustar treino atual",
  progressao_cargas: "Progressão de cargas",
  adaptar_casa: "Adaptar para treino em casa",
};

export const MUDANCA_LABEL: Record<Mudanca["tipo"], string> = {
  exercicio_adicionado: "Exercício adicionado",
  exercicio_removido: "Exercício removido",
  carga_alterada: "Carga alterada",
  series_alteradas: "Séries alteradas",
  dia_adicionado: "Dia adicionado",
  dia_removido: "Dia removido",
  outro: "Outro",
};
