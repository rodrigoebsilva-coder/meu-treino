create type public.origem_exercicio as enum ('base', 'usuario');

-- Base de exercícios: linhas com origem='base' (user_id null) vêm do seed
-- (free-exercise-db); linhas com origem='usuario' são criadas pelo próprio usuário.
create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  origem public.origem_exercicio not null default 'usuario',
  nome text not null,
  grupo_muscular text not null,
  equipamento text,
  youtube_url text,
  imagem_url text,
  criado_em timestamptz not null default now(),
  constraint exercicios_base_sem_user check (
    (origem = 'base' and user_id is null) or
    (origem = 'usuario' and user_id is not null)
  )
);

create index exercicios_grupo_muscular_idx on public.exercicios (grupo_muscular);
create index exercicios_user_id_idx on public.exercicios (user_id);

alter table public.exercicios enable row level security;

-- Todo usuário autenticado vê os exercícios base + os próprios.
create policy "exercicios_select_base_ou_proprio" on public.exercicios
  for select using (origem = 'base' or user_id = auth.uid());

-- Só pode criar/editar/apagar os próprios (nunca a base).
create policy "exercicios_insert_proprio" on public.exercicios
  for insert with check (origem = 'usuario' and user_id = auth.uid());
create policy "exercicios_update_proprio" on public.exercicios
  for update using (origem = 'usuario' and user_id = auth.uid());
create policy "exercicios_delete_proprio" on public.exercicios
  for delete using (origem = 'usuario' and user_id = auth.uid());

-- O import do seed usa a service_role key (bypassa RLS), então não há policy de
-- insert para origem='base' — só o service role pode criar exercícios base.
