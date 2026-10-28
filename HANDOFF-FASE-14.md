# Meu Treino — Relatório da Fase 14 & Handoff para o Claude

> **Data:** 2026-10-27  
> **Autor da Auditoria e Implementação:** Antigravity (Google DeepMind)  
> **Objetivo:** Documentar para o Claude (e para o desenvolvedor) tudo o que foi auditado, as correções implementadas e implantadas na Fase 14, e a lista exata do que ficou como melhoria/pendência para as próximas etapas.

---

## 1. Contexto e Status Geral

A Fase 14 cobriu a **auditoria técnica de segurança, arquitetura, offline-first e integração com IA** do projeto gerado até a Fase 13.

### O que já foi testado, aprovado e implantado:
- ✅ **TypeScript (`npm run typecheck`):** 0 erros.
- ✅ **Linter (`npm run lint`):** 0 erros.
- ✅ **Build de produção local (`npm run build`):** 23 rotas e service worker Serwist PWA compilados com Turbopack com sucesso.
- ✅ **Banco Supabase Cloud:** Migration `0017_seguranca_ajustes.sql` aplicada com sucesso via `supabase db push`.
- ✅ **Edge Functions Cloud:** `gerar-treino` e `listar-modelos` reimplantadas no projeto `bmijwtwtnhzyrdusnmak`.
- ✅ **Repositório Git:** Commit `36b49cd` e push enviados para a branch `main` no GitHub.

---

## 2. O que foi Implementado e Corrigido (Fase 14)

### 2.1 Banco de Dados & Segurança (Postgres / Supabase)
1. **Proteção da RPC `atualizar_dica_casa` (`0017_seguranca_ajustes.sql`):**
   - Antes: Qualquer usuário com JWT autenticado podia alterar a `dica_casa` de qualquer exercício (inclusive exercícios privados de outros usuários e exercícios da base do seed compartilhados por todos).
   - Agora: Valida `origem` e `user_id`. Exercício de usuário (`origem = 'usuario'`) só pode ser alterado pelo dono (`user_id = auth.uid()`). Exercício base (`origem = 'base'`) só pode ser alterado se `public.sou_admin()` for verdadeiro.
2. **Blindagem do Supabase Vault (`0017_seguranca_ajustes.sql`):**
   - Antes: `vault_set_ai_key` confiava nos IDs `claude_key_secret_id`/`gemini_key_secret_id` presentes na tabela `config_ia` (que o usuário podia editar via RLS `update`), arriscando sobrescrever segredos de outros usuários via `vault.update_secret`.
   - Agora: `vault_set_ai_key` busca o segredo existente diretamente na tabela `vault.secrets` através do nome canônico único (`<provedor>_key_<user_id>`), tornando a operação imune a adulterações na tabela `config_ia`.
3. **Credencial Gemini Segura (`supabase/functions/_shared/providers/gemini.ts`):**
   - Antes: Chave de API transmitida como parâmetro de URL (`?key=${apiKey}`), expondo-a em logs de proxies e servidores.
   - Agora: Chave enviada via cabeçalho `x-goog-api-key: apiKey` e o parâmetro `modelo` sanitizado com `encodeURIComponent`.
4. **Proteção contra IDOR em Fotos (`app/(app)/evolucao/fotos/actions.ts`):**
   - Adicionada validação obrigatória garantindo que `storagePath` comece estritamente com `${userData.user.id}/` tanto no insert de metadados (`registrarFoto`) quanto na remoção do storage e banco (`removerFoto`).

### 2.2 Camada Offline, PWA e Execução (Dexie)
1. **Idempotência e Prevenção de Duplicatas no Sync (`lib/offline/sync.ts`):**
   - Antes: `sync.ts` fazia `.insert()` sem passar o `idLocal` gerado no cliente. Falhas de conexão no meio da requisição ou concorrência entre abas criavam sessões e séries duplicadas no Postgres.
   - Agora: Passa `id: sessao.idLocal` e `id: serie.idLocal` utilizando `.upsert(..., { onConflict: "id" })`. Se a chamada repetir, o Postgres simplesmente atualiza a linha existente.
2. **Expurgo Preventivo no Dexie (`lib/offline/sync.ts`):**
   - Adicionada rotina automática que remove do IndexedDB local sessões e séries que já foram concluídas e sincronizadas há mais de 7 dias, evitando vazamento contínuo de memória no dispositivo.
3. **Fallback Inteligente de Carga/Reps (`app/(app)/treino/executar/[treinoDiaId]/execucao-client.tsx`):**
   - Antes: Se o usuário concluísse uma série marcando o checkbox sem digitar nos inputs (vendo apenas o placeholder de sugestão), a série era salva com `cargaRealKg: null` e `repeticoesReal: null`, zerando o cálculo de volume semanal e sumindo dos gráficos de evolução.
   - Agora: O `concluirSerie` adota automaticamente a carga e repetições sugeridas/planejadas caso o input esteja em branco.

### 2.3 IA & Contexto de Geração de Treino
1. **Catálogo de Exercícios no Prompt (`gerar-treino/contexto.ts` e `prompts.ts`):**
   - Antes: O system prompt exigia que a IA usasse `exercicio_id` existentes, mas `montarContexto` nunca passava os exercícios do banco. Ao gerar um ciclo novo, a IA alucinava UUIDs ou criava todos os exercícios do zero com nomes duplicados.
   - Agora: `montarContexto` carrega a lista de exercícios cadastrados e envia no prompt do usuário de forma estruturada.
2. **Enriquecimento com Check-in e Smart Swap (`gerar-treino/contexto.ts`):**
   - As últimas sessões enviadas à IA agora incluem as notas de check-in (`energia`, `sono`, `dor`, `notas`) e a coluna `exercicio_realizado_id` (indicando substituições feitas por aparelho ocupado), permitindo que a IA ajuste volume e intensidade considerando histórico real de recuperação.

### 2.4 Timezone e Consistência de Dados
1. **Fuso de Brasília nos Cálculos de Data (`lib/semana.ts` e `lib/evolucao/dados.ts`):**
   - Antes: `toISOString().slice(0, 10)` usava UTC. No Brasil (UTC-3), treinos feitos após 21:00 BRT pulavam para a data civil do dia seguinte, quebrando o cálculo de Streak e agrupamentos semanais.
   - Agora: Função `dataLocalString()` utiliza fuso `America/Sao_Paulo` (`en-CA`).
2. **Histórico de Cargas com Smart Swap (`lib/evolucao/dados.ts`):**
   - `buscarCargaExercicio` agora combina séries em que o exercício foi o planejado e séries em que foi utilizado como substituto via Smart Swap (`exercicio_realizado_id`).
3. **Backup e Export/Import JSON (`lib/dados/schema.ts`, `route.ts`, `dados/actions.ts`):**
   - `ExportDadosSchema` foi atualizado para incluir os campos da Migration 15 (`sexo`, `cintura_cm`, `quadril_cm`, `peito_cm`, `braco_cm`, `coxa_cm`, `pescoco_cm`) e Migration 16 (`exercicio_realizado_id`), garantindo que o backup não perca medidas corporais nem trocas de exercícios.

---

## 3. Próximos Passos e Pendências Sugeridas (Para o Claude)

Abaixo estão os itens de melhoria identificados na auditoria que ficaram para as próximas sprints/fases:

### 3.1 Limpeza do Dexie no Logout do Usuário (Multi-tenant Local)
- **Onde:** [`app/(app)/actions.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/actions.ts) e [`app/(app)/bottom-nav.tsx`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/bottom-nav.tsx) (ou botão sair em configurações).
- **Cenário:** A Server Action `sair()` desloga o usuário no Supabase Auth no servidor, mas o IndexedDB do navegador (`Dexie("meu-treino")`) mantém o `treinoCache` e dados locais salvos. Se outro usuário logar no mesmo aparelho, o cache antigo pode ser lido offline.
- **O que fazer:** Criar um handler client-side no botão de logout que execute:
  ```ts
  await Promise.all([
    db.treinoCache.clear(),
    db.sessoesLocais.clear(),
    db.seriesLocais.clear(),
  ]);
  ```
  antes de disparar o `sair()`.

### 3.2 Transação Atômica em `aprovarTreino` (Postgres RPC)
- **Onde:** [`app/(app)/treino/gerar-ia/actions.ts`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/app/\(app\)/treino/gerar-ia/actions.ts#L50-L161)
- **Cenário:** `aprovarTreino` faz 5 chamadas sequenciais ao Supabase (arquiva antigo -> insere novo treino -> loop de dias -> loop de exercícios -> gera alternativas). Se a internet cair ou der erro no meio, o treino antigo fica arquivado e o novo parcialmente inserido (risco já aceito no `CLAUDE.md`, mas passível de refinamento).
- **O que fazer:** Criar uma função Postgres com `SECURITY DEFINER` ou transação plpgsql (`public.aprovar_treino_atomico(p_dados jsonb)`) para rodar todo o insert/archive em uma única transação atômica.

### 3.3 Privatizar Leitura do Vault (`vault_get_ai_key`)
- **Onde:** [`supabase/migrations/0006_ia.sql`](file:///d:/Bibliotecas/Documentos/Projetos/Meu Treino/supabase/migrations/0006_ia.sql#L88) e Edge Functions.
- **Cenário:** `vault_get_ai_key` tem `grant execute to authenticated`. Embora seja filtrada por `auth.uid()`, qualquer cliente logado pode invocar `supabase.rpc('vault_get_ai_key')` no console do navegador e inspecionar sua própria chave em texto puro.
- **O que fazer:**
  1. Revogar permissão de `authenticated`: `revoke execute on function public.vault_get_ai_key from authenticated;`
  2. Conceder apenas a `service_role`: `grant execute on function public.vault_get_ai_key to service_role;`
  3. Na Edge Function, buscar a chave instanciando um cliente com a `SUPABASE_SERVICE_ROLE_KEY` após validar o JWT do usuário com `auth.getUser()`.

### 3.4 Curadoria de Conteúdo dos Exercícios (Pendente do roteiro original)
- **Tradução:** Os 876 exercícios do seed (`free-exercise-db`) permanecem com nomes em inglês. Curadoria manual incremental para nomes comuns em pt-BR (ex.: "Barbell Bench Press" -> "Supino Reto com Barra").
- **Imagens:** `imagem_url` continua `null` (podem ser baixadas e hospedadas no Supabase Storage).

### 3.5 Deploy na Vercel (Produção Web)
- A implantação do Next.js precisa apenas da autenticação do CLI na máquina do usuário:
  1. Rodar `npx vercel login` no terminal.
  2. Rodar `npx vercel --prod`.

---

## 4. Mapa dos Arquivos Tocados na Fase 14

- `supabase/migrations/0017_seguranca_ajustes.sql` *(novo)*
- `lib/offline/sync.ts`
- `app/(app)/treino/executar/[treinoDiaId]/execucao-client.tsx`
- `lib/dados/schema.ts`
- `app/(app)/configuracoes/dados/exportar/route.ts`
- `app/(app)/configuracoes/dados/actions.ts`
- `app/(app)/evolucao/fotos/actions.ts`
- `lib/semana.ts`
- `lib/evolucao/dados.ts`
- `supabase/functions/_shared/providers/gemini.ts`
- `supabase/functions/gerar-treino/contexto.ts`
- `supabase/functions/gerar-treino/prompts.ts`
- `CLAUDE.md`
- `AUDITORIA-AJUSTES-SUGERIDOS.md` *(novo)*
- `HANDOFF-FASE-14.md` *(este documento)*
