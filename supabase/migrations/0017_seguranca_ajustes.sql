-- Migration 0017: Ajustes de segurança identificados na auditoria
-- 1. Protege atualizar_dica_casa: restringe edição de exercícios próprios para o dono
--    e exercícios base exclusivamente para administradores.
-- 2. Blindagem de vault_set_ai_key: busca o segredo existente pelo nome canônico
--    escopado a auth.uid(), ignorando IDs manipulados em config_ia.

create or replace function public.atualizar_dica_casa(p_exercicio_id uuid, p_dica text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_origem public.origem_exercicio;
  v_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;

  select origem, user_id into v_origem, v_user_id
    from public.exercicios
   where id = p_exercicio_id;

  if not found then
    raise exception 'Exercício não encontrado.';
  end if;

  if v_origem = 'usuario' and v_user_id <> auth.uid() then
    raise exception 'Sem permissão para alterar exercício de outro usuário.';
  end if;

  if v_origem = 'base' and not public.sou_admin() then
    raise exception 'Apenas administradores podem alterar dicas de exercícios base.';
  end if;

  update public.exercicios
     set dica_casa = nullif(p_dica, '')
   where id = p_exercicio_id;
end; $$;

create or replace function public.vault_set_ai_key(p_provedor public.provedor_ia, p_chave text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_secret_name text;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;

  v_secret_name := p_provedor::text || '_key_' || auth.uid()::text;

  insert into public.config_ia (user_id, modelo_padrao, claude_key_secret_id, gemini_key_secret_id)
  values (auth.uid(), '', null, null)
  on conflict (user_id) do nothing;

  -- Busca o secret_id diretamente em vault.secrets pelo nome do segredo amarrado ao usuário
  select id into v_secret_id
    from vault.secrets
   where name = v_secret_name;

  if v_secret_id is not null then
    perform vault.update_secret(v_secret_id, p_chave);
  else
    v_secret_id := vault.create_secret(p_chave, v_secret_name);
  end if;

  if p_provedor = 'claude' then
    update public.config_ia
       set claude_key_secret_id = v_secret_id, atualizado_em = now()
     where user_id = auth.uid();
  else
    update public.config_ia
       set gemini_key_secret_id = v_secret_id, atualizado_em = now()
     where user_id = auth.uid();
  end if;
end;
$$;
