-- `anamneses` não tinha policy de delete de propósito (0001: "anamnese é
-- versionada, nunca apagada" — o app nunca apaga uma versão individual pra
-- "corrigir" o histórico). "Apagar todos os dados" (Fase 7, configuracoes/
-- dados) é um caso diferente: um reset completo, explícito, disparado só
-- pelo próprio usuário — não é o app sobrescrevendo/editando o histórico.
-- Sem essa policy, apagarTodosDados() falhava silenciosamente só nessa
-- tabela (bug real, encontrado testando: sobrava 1 linha em anamneses
-- depois de "apagar tudo").
create policy "anamneses_delete_own" on public.anamneses
  for delete using (user_id = auth.uid());
