-- Check-in rápido (Fase 7 do roteiro trazido da análise do mt-rodrigo.netlify.app)
-- feito uma vez por sessão, antes da primeira série — fica em `sessoes` (não
-- numa tabela própria) porque está sempre ligado a um treino específico, o
-- que permite cruzar "dormi mal" com o desempenho registrado naquele treino.
alter table public.sessoes
  add column energia smallint check (energia between 0 and 10),
  add column sono smallint check (sono between 0 and 10),
  add column dor text,
  add column notas text;
