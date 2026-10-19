create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  registrado_em date not null default current_date,
  peso_kg numeric,
  cintura_cm numeric,
  peito_cm numeric,
  braco_cm numeric,
  outras jsonb,
  unique (user_id, registrado_em)
);

create table public.fotos_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null,
  registrado_em date not null default current_date,
  criado_em timestamptz not null default now()
);

alter table public.medidas enable row level security;
alter table public.fotos_progresso enable row level security;

create policy "medidas_dono" on public.medidas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fotos_progresso_dono" on public.fotos_progresso
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bucket privado para fotos de progresso. Cada objeto é salvo com o
-- user_id como primeiro segmento do path (ex: "<user_id>/2026-10-18.jpg"),
-- e a policy de storage abaixo restringe acesso a esse segmento.
insert into storage.buckets (id, name, public)
values ('fotos-progresso', 'fotos-progresso', false)
on conflict (id) do nothing;

create policy "fotos_progresso_storage_dono" on storage.objects
  for all using (
    bucket_id = 'fotos-progresso' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'fotos-progresso' and (storage.foldername(name))[1] = auth.uid()::text
  );
