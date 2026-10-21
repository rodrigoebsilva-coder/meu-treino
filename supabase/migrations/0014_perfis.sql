-- Perfis/cargo (Fase 12): o app passa a ter mais de um usuário (admin,
-- professor, aluno), mas "professor" é só um rótulo por enquanto — sem RLS
-- cruzada entre usuários em nenhuma outra tabela. Contas continuam sendo
-- criadas à mão pelo dashboard do Supabase (ver CLAUDE.md); isso aqui só
-- guarda o cargo de cada uma.
create type public.cargo_usuario as enum ('admin', 'professor', 'aluno');

create table public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  data_nascimento date,
  telefone text,
  cargo public.cargo_usuario not null default 'aluno',
  criado_em timestamptz not null default now()
);

-- Função SECURITY DEFINER só pra checar "o usuário atual é admin?" — usada
-- nas policies abaixo. Não dá pra fazer esse `exists (select ... from
-- perfis ...)` direto dentro de uma policy de `perfis`: a policy de select
-- se aplicaria de novo à própria subquery, que re-avalia a mesma policy, e
-- por aí vai — "infinite recursion detected in policy" (erro real,
-- encontrado testando). Uma função definer quebra esse ciclo porque roda
-- com o privilégio de quem é dono da função (bypassa RLS), não do usuário
-- que chamou.
create or replace function public.sou_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and cargo = 'admin');
$$;

alter table public.perfis enable row level security;

create policy "perfis_select_own" on public.perfis
  for select using (user_id = auth.uid());
create policy "perfis_select_admin" on public.perfis
  for select using (public.sou_admin());
create policy "perfis_update_own" on public.perfis
  for update using (user_id = auth.uid());
create policy "perfis_update_admin" on public.perfis
  for update using (public.sou_admin());
-- Sem policy de insert/delete: linhas só nascem pelo trigger abaixo
-- (SECURITY DEFINER, roda sem RLS) e nunca são apagadas pelo app.

-- Só admin pode mudar o cargo de alguém — nem a própria policy de
-- "update_own" deixa um usuário virar admin sozinho via chamada direta à
-- API (a UI nunca manda esse campo fora da tela de admin, mas o guarda-costas
-- real é esse trigger).
create or replace function public.proteger_cargo_perfis()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() nulo = contexto sem sessão de usuário (migration, service
  -- role) — não é um pedido de um usuário real tentando se promover, então
  -- não bloqueia (é o que permite o bootstrap do primeiro admin abaixo).
  if new.cargo is distinct from old.cargo and auth.uid() is not null then
    if not public.sou_admin() then
      raise exception 'Só admin pode alterar o cargo.';
    end if;
  end if;
  return new;
end; $$;

create trigger perfis_protege_cargo
  before update on public.perfis
  for each row execute function public.proteger_cargo_perfis();

-- Cria o perfil automaticamente quando uma conta nova é criada no Supabase
-- Auth (até agora não existia nenhum trigger em auth.users).
create or replace function public.criar_perfil_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (user_id, email) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Backfill: cria perfil pra quem já existe em auth.users (usuário dev/prod
-- atual) e faz o bootstrap do primeiro admin — sem isso ninguém teria cargo
-- 'admin' pra poder atribuir cargo a mais ninguém pela UI.
insert into public.perfis (user_id, email)
select id, email from auth.users
where id not in (select user_id from public.perfis);

update public.perfis set cargo = 'admin' where email = 'rodrigoebsilva@gmail.com';
