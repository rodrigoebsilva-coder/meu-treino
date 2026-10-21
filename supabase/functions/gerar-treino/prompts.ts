import type { TipoAcao, TreinoGerado } from "../_shared/schemas.ts";
import type { Contexto } from "./contexto.ts";

const DESCRICAO_TIPO_ACAO: Record<TipoAcao, string> = {
  novo_ciclo: "Criar um ciclo de treino completamente novo, substituindo o atual.",
  ajustar: "Ajustar o treino atual a partir do pedido do usuário, mantendo o que já funciona.",
  progressao_cargas: "Atualizar as cargas sugeridas com base no desempenho real registrado nas últimas sessões, mantendo a estrutura do treino.",
  adaptar_casa: "Adaptar o treino atual para poder ser feito em casa, trocando exercícios que dependem de equipamento de academia.",
};

export function montarSystemPrompt(): string {
  return [
    "Você é um personal trainer experiente, especialista em hipertrofia e treinamento de força.",
    "Gere ou ajuste um plano de treino em português do Brasil, devolvendo OBRIGATORIAMENTE um objeto no formato exigido pela tool/schema fornecido.",
    "Regras:",
    "- Prefira exercícios já existentes na base (use exercicio_id) quando houver um equivalente adequado; só sugira um exercício novo (nome_exercicio_sugerido, com exercicio_id null) quando não houver opção parecida na base.",
    "- Respeite o nível, objetivo, lesões e dias disponíveis informados no perfil do usuário.",
    "- Sempre preencha \"justificativa\" explicando o raciocínio em 2 a 4 frases, em português.",
    "- Ao ajustar um treino existente (tipo de ação != novo_ciclo), preencha \"mudancas\" descrevendo cada alteração relevante; ao criar um ciclo novo do zero, \"mudancas\" pode ficar vazio.",
  ].join("\n");
}

export function montarUserPrompt(
  contexto: Contexto,
  tipoAcao: TipoAcao,
  pedidoUsuario: string,
  propostaAnterior?: TreinoGerado
): string {
  const partes: string[] = [
    `Ação solicitada: ${tipoAcao} — ${DESCRICAO_TIPO_ACAO[tipoAcao]}`,
    `Pedido específico do usuário: ${pedidoUsuario.trim() || "(nenhum pedido adicional)"}`,
    `Perfil / anamnese atual: ${JSON.stringify(contexto.anamnese)}`,
    `Treino ativo atual (pode ser null se nunca houve um): ${JSON.stringify(contexto.treinoAtivo)}`,
    `Ciclos anteriores (resumo): ${JSON.stringify(contexto.treinosAnteriores)}`,
    `Últimas sessões de execução registradas: ${JSON.stringify(contexto.sessoesRecentes)}`,
    `Evolução física recente (medidas): ${JSON.stringify(contexto.medidas)}`,
  ];

  if (propostaAnterior) {
    partes.push(
      `Esta é uma iteração sobre uma proposta anterior que o usuário pediu para ajustar: ${JSON.stringify(propostaAnterior)}`
    );
  }

  return partes.join("\n\n");
}
