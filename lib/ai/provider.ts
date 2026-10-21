import type { TipoAcao, TreinoGerado } from "./schemas";

export type ProvedorIA = "claude" | "gemini";

export interface ModeloDisponivel {
  id: string;
  nome: string;
}

// Corpo enviado para a Edge Function `gerar-treino`. O contexto (anamnese,
// treino atual, histórico de execução, evolução física) é montado lá dentro
// a partir do auth.uid() do chamador — o cliente só manda a intenção.
export interface GerarTreinoBody {
  provedor: ProvedorIA;
  modelo: string;
  tipoAcao: TipoAcao;
  pedidoUsuario: string;
  propostaAnterior?: TreinoGerado;
}

export interface GerarTreinoResponse {
  treino: TreinoGerado;
  geracaoId: string;
}
