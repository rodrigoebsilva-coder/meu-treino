-- Smart Swap (Fase 13): duas alternativas por exercício, calculadas (não
-- pela IA) no momento em que o treino é criado/aprovado — mesmo espírito da
-- decisão do mesociclo (lib/mesociclo/fases.ts): regra determinística, sem
-- tocar no contrato JSON compartilhado com a Edge Function.
create table public.treino_exercicio_alternativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_exercicio_id uuid not null references public.treino_exercicios(id) on delete cascade,
  exercicio_id uuid not null references public.exercicios(id) on delete cascade,
  ordem int not null,
  unique (treino_exercicio_id, ordem)
);

alter table public.treino_exercicio_alternativas enable row level security;
create policy "treino_exercicio_alternativas_dono" on public.treino_exercicio_alternativas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Exercício realmente feito numa série, quando diferente do planejado (troca
-- "só por hoje" — treino_exercicios.exercicio_id nunca muda por causa
-- disso). Null = fez o que estava planejado, o caso de longe mais comum.
alter table public.sessao_series
  add column exercicio_realizado_id uuid references public.exercicios(id) on delete set null;
