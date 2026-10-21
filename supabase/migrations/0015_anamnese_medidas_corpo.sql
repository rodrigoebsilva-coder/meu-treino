-- Medidas corporais na anamnese (Fase 12), pra calcular IMC e TMB (taxa
-- metabólica basal, fórmula Mifflin-St Jeor — ver lib/perfil/metricas.ts).
-- Tudo opcional: nem todo mundo quer preencher tudo no primeiro cadastro, e
-- IMC já funciona só com peso+altura (que já são obrigatórios).
alter table public.anamneses
  add column sexo text check (sexo in ('masculino', 'feminino')),
  add column cintura_cm numeric,
  add column quadril_cm numeric,
  add column peito_cm numeric,
  add column braco_cm numeric,
  add column coxa_cm numeric,
  add column pescoco_cm numeric;

-- Mesmo lembrete da migration 0011: `anamnese_atual` usa `select *`, que o
-- Postgres não atualiza sozinho quando a tabela base ganha colunas novas —
-- precisa recriar a view pra elas aparecerem.
create or replace view public.anamnese_atual with (security_invoker = true) as
  select distinct on (user_id) *
  from public.anamneses
  order by user_id, versao desc;
