create type public.status_treino as enum ('ativo', 'arquivado', 'rascunho_ia');
create type public.origem_treino as enum ('manual', 'claude', 'gemini');
create type public.metodo_serie as enum ('normal', 'biset', 'drop_set', 'rest_pause', 'piramide');

-- geracao_ia_id referencia geracoes_ia (criada em 0006_ia.sql). A FK é
-- adicionada via alter table no final de 0006, para não inverter a ordem de
-- criação das tabelas.
create table public.treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome_ciclo text not null,
  status public.status_treino not null default 'rascunho_ia',
  origem public.origem_treino not null,
  geracao_ia_id uuid,
  justificativa_ia text,
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz
);

-- Garante um único treino ativo por usuário ao mesmo tempo.
create unique index treinos_um_ativo_por_usuario
  on public.treinos (user_id) where (status = 'ativo');

create table public.treino_dias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_id uuid not null references public.treinos(id) on delete cascade,
  ordem int not null,
  nome text not null,
  grupos_musculares text[] not null default '{}',
  unique (treino_id, ordem)
);

create table public.treino_exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_dia_id uuid not null references public.treino_dias(id) on delete cascade,
  exercicio_id uuid references public.exercicios(id) on delete set null,
  nome_exercicio_sugerido text,
  ordem int not null,
  series int not null,
  repeticoes_min int not null,
  repeticoes_max int not null,
  carga_sugerida_kg numeric,
  descanso_segundos int not null default 60,
  metodo public.metodo_serie not null default 'normal',
  observacao text,
  unique (treino_dia_id, ordem)
);

create index treino_dias_treino_id_idx on public.treino_dias (treino_id);
create index treino_exercicios_treino_dia_id_idx on public.treino_exercicios (treino_dia_id);
create index treino_exercicios_exercicio_id_idx on public.treino_exercicios (exercicio_id);

alter table public.treinos enable row level security;
alter table public.treino_dias enable row level security;
alter table public.treino_exercicios enable row level security;

create policy "treinos_dono" on public.treinos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "treino_dias_dono" on public.treino_dias
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "treino_exercicios_dono" on public.treino_exercicios
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
