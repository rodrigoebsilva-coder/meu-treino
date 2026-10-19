-- Anamnese do usuário, versionada. A IA sempre recebe a versão mais recente.
create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  versao int not null,
  idade int not null,
  altura_cm numeric not null,
  peso_inicial_kg numeric not null,
  nivel text not null check (nivel in ('iniciante', 'intermediario', 'avancado')),
  lesoes text,
  objetivo text not null,
  dias_disponiveis int not null check (dias_disponiveis between 1 and 7),
  local_treino text not null check (local_treino in ('academia', 'casa', 'hibrido')),
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, versao)
);

alter table public.anamneses enable row level security;

create policy "anamneses_select_own" on public.anamneses
  for select using (user_id = auth.uid());
create policy "anamneses_insert_own" on public.anamneses
  for insert with check (user_id = auth.uid());
create policy "anamneses_update_own" on public.anamneses
  for update using (user_id = auth.uid());
-- Sem policy de delete: anamnese é versionada, nunca apagada.

-- security_invoker: a view roda com os privilégios de quem a consulta, não do
-- criador, então a RLS de anamneses continua valendo (Postgres 15+/Supabase).
create view public.anamnese_atual with (security_invoker = true) as
  select distinct on (user_id) *
  from public.anamneses
  order by user_id, versao desc;
