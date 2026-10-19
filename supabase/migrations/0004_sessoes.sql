create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_dia_id uuid references public.treino_dias(id) on delete set null,
  iniciada_em timestamptz not null default now(),
  finalizada_em timestamptz,
  duracao_segundos int
);

create table public.sessao_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sessao_id uuid not null references public.sessoes(id) on delete cascade,
  treino_exercicio_id uuid references public.treino_exercicios(id) on delete set null,
  numero_serie int not null,
  carga_real_kg numeric,
  repeticoes_real int,
  rpe int check (rpe between 1 and 10),
  concluida_em timestamptz not null default now(),
  -- registrada offline: o cliente gera o id localmente e sincroniza depois
  origem_offline boolean not null default false
);

create index sessoes_treino_dia_id_idx on public.sessoes (treino_dia_id);
create index sessao_series_sessao_id_idx on public.sessao_series (sessao_id);
create index sessao_series_treino_exercicio_id_idx on public.sessao_series (treino_exercicio_id);

alter table public.sessoes enable row level security;
alter table public.sessao_series enable row level security;

create policy "sessoes_dono" on public.sessoes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sessao_series_dono" on public.sessao_series
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
