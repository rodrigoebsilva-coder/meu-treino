-- `anamnese_atual` usa `select *`, que no Postgres é expandido pra lista de
-- colunas no momento em que a view é criada — colunas adicionadas depois na
-- tabela base (aqui, meta_peso_kg/meta_prazo da migration 0010) não aparecem
-- na view até ela ser recriada (bug real, encontrado testando: a checagem de
-- realismo da meta nunca aparecia porque `atual.meta_peso_kg` vinha undefined).
-- `create or replace view` com o mesmo texto reexpande o `*` pra lista atual
-- de colunas — funciona porque só adicionamos colunas no final da tabela.
create or replace view public.anamnese_atual with (security_invoker = true) as
  select distinct on (user_id) *
  from public.anamneses
  order by user_id, versao desc;
