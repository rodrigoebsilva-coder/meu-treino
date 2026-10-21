-- Mesociclo (Fase 7 do roteiro trazido da análise do mt-rodrigo.netlify.app,
-- a mais estrutural, combinada deliberadamente por último). Duração fixa em
-- semanas, decidida pelo usuário ao gerar um ciclo novo (default 12) — as
-- fases (Acumulação/Intensificação/Deload) são calculadas por uma heurística
-- fixa no app (lib/mesociclo/fases.ts), não pela IA: menos risco de mexer no
-- contrato JSON compartilhado (schemas.ts) que já funciona em produção.
-- `default 12` cobre os treinos que já existem (seed local e produção) sem
-- precisar de um backfill separado.
alter table public.treinos add column duracao_semanas int not null default 12;
