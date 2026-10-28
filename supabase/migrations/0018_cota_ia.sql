-- Migration 0018: chave de IA compartilhada (a do admin) + cota de gerações por usuário.
-- Usuário comum gera 1 treino por vez com a chave do admin; o admin libera mais uma.
-- Admin usa a própria chave e não tem limite.

-- Sem linha = 1 crédito (default). Escrita só por funções SECURITY DEFINER abaixo.
create table public.cota_ia (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creditos int not null default 1 check (creditos >= 0),
  atualizado_em timestamptz not null default now()
);

alter table public.cota_ia enable row level security;

create policy "cota_ia_select_own_ou_admin" on public.cota_ia
  for select using (user_id = auth.uid() or public.sou_admin());

-- Admin libera mais uma geração para um usuário.
create or replace function public.liberar_geracao(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then
    raise exception 'Só admin pode liberar gerações.';
  end if;

  -- Sem linha equivale a 1 crédito, então a primeira liberação já cria com 2.
  insert into public.cota_ia (user_id, creditos) values (p_user_id, 2)
  on conflict (user_id) do update
    set creditos = public.cota_ia.creditos + 1, atualizado_em = now();
end; $$;

-- Consumo e devolução: só a Edge Function (service_role) chama, depois de validar o JWT.
create or replace function public.consumir_geracao(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.cota_ia (user_id) values (p_user_id) on conflict (user_id) do nothing;

  update public.cota_ia
     set creditos = creditos - 1, atualizado_em = now()
   where user_id = p_user_id and creditos > 0;

  return found;
end; $$;

create or replace function public.devolver_geracao(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.cota_ia set creditos = creditos + 1, atualizado_em = now() where user_id = p_user_id;
$$;

-- Provedor, modelo e chave do primeiro admin (dono da chave compartilhada).
create or replace function public.vault_get_chave_compartilhada()
returns table (provedor public.provedor_ia, modelo text, chave text)
language sql security definer set search_path = public, vault as $$
  select c.provedor_padrao,
         c.modelo_padrao,
         (select s.decrypted_secret
            from vault.decrypted_secrets s
           where s.id = case c.provedor_padrao
                          when 'claude' then c.claude_key_secret_id
                          else c.gemini_key_secret_id
                        end)
    from public.perfis p
    join public.config_ia c on c.user_id = p.user_id
   where p.cargo = 'admin'
   order by p.criado_em
   limit 1;
$$;

revoke execute on function public.consumir_geracao(uuid) from public, anon, authenticated;
revoke execute on function public.devolver_geracao(uuid) from public, anon, authenticated;
revoke execute on function public.vault_get_chave_compartilhada() from public, anon, authenticated;
grant execute on function public.consumir_geracao(uuid) to service_role;
grant execute on function public.devolver_geracao(uuid) to service_role;
grant execute on function public.vault_get_chave_compartilhada() to service_role;
