create extension if not exists supabase_vault;

create type public.provedor_ia as enum ('claude', 'gemini');

-- Config por usuário: provedor/modelo padrão + referência às chaves no Vault.
-- A chave em si NUNCA fica em texto puro nesta tabela.
create table public.config_ia (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  provedor_padrao public.provedor_ia not null default 'claude',
  modelo_padrao text not null,
  claude_key_secret_id uuid,
  gemini_key_secret_id uuid,
  atualizado_em timestamptz not null default now()
);

alter table public.config_ia enable row level security;
create policy "config_ia_dono" on public.config_ia
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Únicas funções que podem ler/escrever no Vault para este app. Rodam com
-- os privilégios do criador (security definer), mas sempre restritas ao
-- auth.uid() de quem chamou — nunca ao parâmetro informado pelo chamador.
-- Só a Edge Function `gerar-treino`/`configuracoes-ia` deve chamá-las,
-- repassando o JWT do próprio usuário (nunca a service role).
create or replace function public.vault_set_ai_key(p_provedor public.provedor_ia, p_chave text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  insert into public.config_ia (user_id, modelo_padrao, claude_key_secret_id, gemini_key_secret_id)
  values (auth.uid(), '', null, null)
  on conflict (user_id) do nothing;

  select (case when p_provedor = 'claude' then claude_key_secret_id else gemini_key_secret_id end)
    into v_secret_id
    from public.config_ia
    where user_id = auth.uid();

  -- Trocar a chave atualiza o segredo existente em vez de criar um novo:
  -- vault.create_secret exige um "name" único, e sempre usamos o mesmo
  -- nome (<provedor>_key_<user_id>) — criar de novo colidiria.
  if v_secret_id is not null then
    perform vault.update_secret(v_secret_id, p_chave);
  else
    v_secret_id := vault.create_secret(p_chave, p_provedor::text || '_key_' || auth.uid()::text);
    if p_provedor = 'claude' then
      update public.config_ia set claude_key_secret_id = v_secret_id, atualizado_em = now()
        where user_id = auth.uid();
    else
      update public.config_ia set gemini_key_secret_id = v_secret_id, atualizado_em = now()
        where user_id = auth.uid();
    end if;
  end if;
end;
$$;

create or replace function public.vault_get_ai_key(p_provedor public.provedor_ia)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_key text;
begin
  select (case when p_provedor = 'claude' then claude_key_secret_id else gemini_key_secret_id end)
    into v_secret_id
    from public.config_ia
    where user_id = auth.uid();

  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where id = v_secret_id;
  return v_key;
end;
$$;

revoke execute on function public.vault_set_ai_key(public.provedor_ia, text) from public, anon;
revoke execute on function public.vault_get_ai_key(public.provedor_ia) from public, anon;
grant execute on function public.vault_set_ai_key(public.provedor_ia, text) to authenticated;
grant execute on function public.vault_get_ai_key(public.provedor_ia) to authenticated;

create table public.geracoes_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provedor public.provedor_ia not null,
  modelo text not null,
  tipo_acao text not null,
  prompt_enviado jsonb not null,
  resposta_bruta jsonb,
  tokens_entrada int,
  tokens_saida int,
  sucesso boolean not null,
  erro text,
  criado_em timestamptz not null default now()
);

create index geracoes_ia_user_id_criado_em_idx on public.geracoes_ia (user_id, criado_em desc);

alter table public.geracoes_ia enable row level security;
create policy "geracoes_ia_dono" on public.geracoes_ia
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.treinos add constraint treinos_geracao_ia_fk
  foreign key (geracao_ia_id) references public.geracoes_ia(id) on delete set null;
