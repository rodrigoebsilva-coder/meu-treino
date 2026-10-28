# Meu Treino — Plano de Ajustes e Correções de Auditoria

> Documento gerado em 2026-10-27 a partir da auditoria técnica e análise de vulnerabilidades do app gerado com Claude.
> Complementa e endereça os pontos identificados em `AUDITORIA-PROJETO.md`.

---

## Sumário Executivo

A auditoria identificou oportunidades de melhoria e correções em 5 áreas principais:
1. **Segurança & Proteção de Dados (RLS, Vault e RPC)**
2. **Integração com IA (Prompts, Catálogo de Exercícios e Contexto)**
3. **PWA, Dexie e Sincronização Offline (Idempotência e Vazamento)**
4. **Precisão de Métricas & Timezone (Cálculo de Cargas, Streak e Fusos)**
5. **Consistência de Backup (Exportação/Importação JSON)**

---

## Matriz de Prioridades

| ID | Prioridade | Domínio | Descrição do Ajuste | Impacto |
|---|---|---|---|---|
| **SEC-01** | 🔴 P0 (Crítico) | Segurança / Vault | Revogar permissão pública/autenticada de `vault_get_ai_key` | Evita extração de chaves de API via console/XSS |
| **SEC-02** | 🔴 P0 (Crítico) | Segurança / RPC | Restringir `atualizar_dica_casa` por dono/admin | Impede sobrescrita de dicas globais e de outros alunos |
| **SEC-03** | 🔴 P0 (Crítico) | Segurança / Vault | Prevenir sobrescrita cega de segredos em `vault_set_ai_key` | Impede ataque de hijacking de chaves no Vault |
| **AI-01** | 🔴 P0 (Crítico) | IA / Backend | Enviar catálogo de exercícios da base no contexto da IA | Corrige alucinação de IDs e duplicação em novos ciclos |
| **OFF-01** | 🟠 P1 (Alto) | Offline / Dexie | Idempotência e chave primária remota no `sync.ts` | Elimina criação de sessões/séries duplicadas |
| **OFF-02** | 🟠 P1 (Alto) | Execução / UX | Fallback automático de carga/reps se input ficar vazio | Evita séries registradas com volume 0 kg |
| **OFF-03** | 🟠 P1 (Alto) | Offline / Dexie | Limpeza de histórico sincronizado e purge no logout | Impede memory leak no Dexie e vazamento entre contas |
| **DATA-01** | 🟠 P1 (Alto) | Backup / Schema | Atualizar `ExportDadosSchema` com campos das Migrations 15 e 16 | Evita perda de medidas e dados do Smart Swap no backup |
| **AI-02** | 🟡 P2 (Médio) | IA / Contexto | Incluir dados de Check-in e Smart Swap em `sessoesRecentes` | IA consegue correlacionar sono/energia com desempenho |
| **SEC-04** | 🟡 P2 (Médio) | Segurança / API | Mover chave Gemini para header `x-goog-api-key` e validar `modelo` | Previne vazamento de credencial em logs e SSRF |
| **SEC-05** | 🟡 P2 (Médio) | Segurança / Storage | Validar prefixo de `storagePath` em fotos de progresso | Impede associação indevida de paths de outros usuários |
| **DATA-02** | 🟡 P2 (Médio) | Métricas / Timezone | Corrigir extração de data civil para fuso local (UTC-3) | Evita que treinos após 21h pulem para o dia seguinte |
| **DATA-03** | 🟡 P2 (Médio) | Gráficos / Smart Swap | Corrigir `buscarCargaExercicio` com `exercicio_realizado_id` | Gráfico de evolução reflete a carga do exercício real |

---

## 1. Segurança e Banco de Dados (Postgres / Supabase)

### SEC-01 — Revogar `EXECUTE` de `vault_get_ai_key` para usuários autenticados
* **Arquivo:** [`supabase/migrations/0006_ia.sql`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/migrations/0006_ia.sql#L88)
* **Vulnerabilidade:** `grant execute on function public.vault_get_ai_key to authenticated;` expõe as chaves de API Claude/Gemini em texto puro para qualquer script no navegador via `supabase.rpc('vault_get_ai_key')`.
* **Solução:**
  1. Criar nova migration removendo permissões de acesso da role `authenticated` e `anon`.
  2. Permitir execução exclusivamente para `service_role` (usada pelas Edge Functions).
  ```sql
  revoke execute on function public.vault_get_ai_key(public.provedor_ia) from authenticated, anon, public;
  grant execute on function public.vault_get_ai_key(public.provedor_ia) to service_role;
  ```

### SEC-02 — Blindar RPC `atualizar_dica_casa` contra adulteração cruzada
* **Arquivo:** [`supabase/migrations/0008_atualizar_dica_casa.sql`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/migrations/0008_atualizar_dica_casa.sql#L8-L16)
* **Vulnerabilidade:** A função atualiza qualquer ID de exercício sem checar se a linha é do usuário ou se o usuário é administrador ao tentar editar um exercício base.
* **Solução:**
  ```sql
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
  ```

### SEC-03 — Prevenir sobrescrita de segredos no Vault
* **Arquivo:** [`supabase/migrations/0006_ia.sql`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/migrations/0006_ia.sql#L38-L58)
* **Vulnerabilidade:** A função `vault_set_ai_key` confia nos IDs de segredo salvos em `config_ia` (que o usuário pode editar diretamente via RLS UPDATE).
* **Solução:**
  Na função `vault_set_ai_key`, buscar o segredo existente diretamente na tabela `vault.secrets` através do nome padronizado escopado (`p_provedor::text || '_key_' || auth.uid()::text`), em vez de ler o ID passado em `config_ia`.

### SEC-04 — Chave Gemini no Header e Sanitização de Modelos
* **Arquivo:** [`supabase/functions/_shared/providers/gemini.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/functions/_shared/providers/gemini.ts#L16-L28)
* **Vulnerabilidade:** Chave transmitida via query string (`?key=...`) e interpolação direta de `${modelo}` na URL.
* **Solução:**
  - Enviar chave no header `x-goog-api-key: apiKey`.
  - Validar `modelo` contra regex rígida (`/^[a-zA-Z0-9._-]+$/`).

### SEC-05 — Validação de Prefixo de Diretório nas Fotos de Progresso
* **Arquivo:** [`app/(app)/evolucao/fotos/actions.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/evolucao/fotos/actions.ts#L6-L35)
* **Vulnerabilidade:** Parâmetro `storagePath` recebido do client não valida se começa com `${userId}/`.
* **Solução:**
  Adicionar asserção obrigatória:
  ```ts
  if (!storagePath.startsWith(`${userData.user.id}/`)) {
    return { erro: "Caminho de arquivo inválido." };
  }
  ```

---

## 2. Geração e Ajuste de Treino por IA

### AI-01 — Envio do Catálogo de Exercícios da Base no Contexto
* **Arquivos:**
  - [`supabase/functions/gerar-treino/contexto.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/functions/gerar-treino/contexto.ts)
  - [`supabase/functions/gerar-treino/prompts.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/functions/gerar-treino/prompts.ts)
* **Problema:** A IA é instruída a reutilizar `exercicio_id` existentes, mas nunca recebe o catálogo de exercícios. Em novos ciclos, ela alucina IDs inexistentes ou gera novos nomes duplicados.
* **Solução:**
  1. Na função `montarContexto()`, carregar os exercícios disponíveis (base + usuário):
     ```ts
     const { data: exerciciosBase } = await supabase
       .from("exercicios")
       .select("id, nome, grupo_muscular, equipamento")
       .order("nome");
     ```
  2. Adicionar ao prompt do usuário uma lista resumida em formato compacto dos exercícios disponíveis para os grupos musculares da anamnese.

### AI-02 — Contextualização com Check-in e Trocas de Exercício
* **Arquivo:** [`supabase/functions/gerar-treino/contexto.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/functions/gerar-treino/contexto.ts#L22-L29)
* **Problema:** As sessões recentes enviadas para a IA não incluem as notas de check-in (`energia`, `sono`, `dor`, `notas`) nem se houve substituição via Smart Swap (`exercicio_realizado_id`).
* **Solução:**
  Expandir a query de `sessoesRecentes` para incluir essas colunas, permitindo que a IA faça progressões conscientes de carga considerando fadiga e dores relatadas.

---

## 3. PWA, Dexie e Execução Offline

### OFF-01 — Idempotência e Envio de Chaves Primárias no `sync.ts`
* **Arquivo:** [`lib/offline/sync.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/offline/sync.ts#L44-L93)
* **Problema:** O cliente gera `idLocal: crypto.randomUUID()`, mas faz `.insert()` no Supabase sem enviar o `id`. Se houver falha de rede ou duas abas abertas, cria linhas duplicadas no Postgres.
* **Solução:**
  1. Enviar `id: sessao.idLocal` e `id: serie.idLocal` nos payloads.
  2. Utilizar `.upsert(..., { onConflict: "id" })` para garantir idempotência completa em qualquer tentativa repetida de sincronização.

### OFF-02 — Fallback de Carga e Repetições na Execução Guiada
* **Arquivo:** [`app/(app)/treino/executar/[treinoDiaId]/execucao-client.tsx`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/treino/executar/\[treinoDiaId\]/execucao-client.tsx#L157-L175)
* **Problema:** Ao marcar o checkbox da série sem preencher os inputs, a série é registrada com `cargaRealKg: null` e `repeticoesReal: null`, zerando o cálculo de volume semanal e gráficos.
* **Solução:**
  No momento de concluir a série, se o input estiver em branco, adotar os valores exibidos como sugestão no placeholder:
  ```ts
  const cargaFinal = v?.carga !== undefined && v.carga !== "" 
    ? Number(v.carga) 
    : (sugestao?.cargaRealKg ?? ex.carga_sugerida_kg ?? null);

  const repsFinal = v?.reps !== undefined && v.reps !== "" 
    ? Number(v.reps) 
    : (sugestao?.repeticoesReal ?? ex.repeticoes_min ?? null);
  ```

### OFF-03 — Expurgar Histórico Sincronizado e Reset no Logout
* **Arquivos:**
  - [`lib/offline/sync.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/offline/sync.ts)
  - [`app/(app)/actions.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/actions.ts#L6-L10)
* **Problema:** Sessões e séries antigas permanecem no Dexie para sempre. Se outro usuário fizer login no mesmo aparelho, herda o cache e as sessões pendentes.
* **Solução:**
  1. Adicionar rotina de exclusão de sessões no Dexie que já foram sincronizadas há mais de 7 dias.
  2. Na Server Action `sair()`, orientar o cliente a limpar as tabelas locais do Dexie (`db.delete()`).

---

## 4. Consistência de Dados, Timezones e Métricas

### DATA-01 — Atualizar Schema de Backup (Export/Import JSON)
* **Arquivos:**
  - [`lib/dados/schema.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/dados/schema.ts)
  - [`app/(app)/configuracoes/dados/exportar/route.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/configuracoes/dados/exportar/route.ts)
  - [`app/(app)/configuracoes/dados/actions.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/configuracoes/dados/actions.ts)
* **Problema:** Os schemas de importação/exportação não foram atualizados nas Fases 12 e 13, descartando campos de medidas corporais da anamnese e o `exercicio_realizado_id` das séries.
* **Solução:**
  - Adicionar ao `AnamneseExportSchema`: `sexo`, `cintura_cm`, `quadril_cm`, `peito_cm`, `braco_cm`, `coxa_cm`, `pescoco_cm`.
  - Adicionar ao `SessaoSerieExportSchema`: `exercicio_realizado_id`.
  - Atualizar o `select` do `exportar/route.ts` e a rotina `aplicarImportacao()`.

### DATA-02 — Ajuste de Fuso Horário no Cálculo de Streak e Gráficos
* **Arquivos:**
  - [`lib/semana.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/semana.ts)
  - [`lib/evolucao/dados.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/evolucao/dados.ts#L77)
* **Problema:** Treinos realizados no Brasil após as 21:00 BRT convertem `toISOString().slice(0, 10)` para a data do dia seguinte em UTC, corrompendo o streak de dias consecutivos.
* **Solução:**
  Substituir o slicing de ISO UTC por data no fuso `America/Sao_Paulo`:
  ```ts
  export function dataLocalString(data: Date | string): string {
    const d = typeof data === "string" ? new Date(data) : data;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
  ```

### DATA-03 — Progresso de Cargas com Smart Swap
* **Arquivo:** [`lib/evolucao/dados.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/lib/evolucao/dados.ts#L99-L106)
* **Problema:** A query `buscarCargaExercicio` busca apenas por `treino_exercicios.exercicio_id`. Se o usuário trocou o exercício na sessão (ex: supino por halteres), a carga entra incorretamente no histórico do exercício planejado.
* **Solução:**
  Considerar `coalesce(sessao_series.exercicio_realizado_id, treino_exercicios.exercicio_id) = exercicioId`.

---

## Próximos Passos Recomendados

1. **Sprint 1 (Segurança & Banco):** Implementar as migrations corretivas para o Vault e RPC `atualizar_dica_casa`.
2. **Sprint 2 (IA & Dexie):** Injetar o catálogo de exercícios no contexto da Edge Function e aplicar idempotência no `sync.ts`.
3. **Sprint 3 (UX & Dados):** Corrigir fallback de inputs na execução, fuso horário e sincronizar o schema de backup.
