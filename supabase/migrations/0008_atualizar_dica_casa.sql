-- `exercicios` só permite update direto via RLS pra origem='usuario' (ver
-- policy exercicios_update_proprio em 0002) — exercícios 'base' (a maioria,
-- seedados do free-exercise-db) não são editáveis pelo cliente. dica_casa
-- (Fase 7) precisa ser editável pelo usuário mesmo em exercícios base, então
-- usa o mesmo padrão de função SECURITY DEFINER já usado pro Vault
-- (vault_set_ai_key/vault_get_ai_key em 0006): só altera essa coluna, nunca
-- nome/grupo_muscular/etc.
create or replace function public.atualizar_dica_casa(p_exercicio_id uuid, p_dica text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.exercicios set dica_casa = nullif(p_dica, '') where id = p_exercicio_id;
end; $$;
