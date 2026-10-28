-- Migration 0019: exercícios de cardio (esteira, bike...) medidos por tempo, não por kg/reps.

alter table public.exercicios
  add column tipo text not null default 'forca' check (tipo in ('forca', 'cardio'));

alter table public.treino_exercicios
  add column duracao_minutos int check (duracao_minutos > 0);

alter table public.sessao_series
  add column duracao_segundos int check (duracao_segundos >= 0);

-- Em produção os exercícios base já existem; no `db reset` local este UPDATE não acha
-- nada (migrations rodam antes dos seeds) — por isso o mesmo UPDATE está em seeds/06_cardio.sql.
update public.exercicios
   set tipo = 'cardio'
 where origem = 'base' and nome in (
  'Bicycling',
  'Bicycling, Stationary',
  'Elliptical Trainer',
  'Jogging, Treadmill',
  'Rowing, Stationary',
  'Running, Treadmill',
  'Stairmaster',
  'Step Mill',
  'Trail Running/Walking',
  'Walking, Treadmill',
  'Rope Jumping',
  'Skating',
  'Fast Skipping',
  'Mountain Climbers',
  'Battling Ropes'
);
