# Meu Treino

App de treino pessoal (usuário único, eu) com plano de treino gerado/atualizado por
IA (Claude ou Gemini). Pedido original em
[prompt-claude-code-app-treinos.md](prompt-claude-code-app-treinos.md); plano técnico
da Fase 0 em `C:\Users\Rodrigo\.claude\plans\purrfect-dreaming-umbrella.md` (fora do
repo — se precisar, releia o plano aprovado antes de alterar schema/Edge Function).

## Stack

- Next.js (App Router) + TypeScript + TailwindCSS v4 + shadcn/ui, PWA via
  `@serwist/turbopack` (Next 16 usa Turbopack por padrão — **não** usar `@serwist/next`,
  que é webpack-only).
- Supabase: Postgres, Auth, RLS, Storage, Edge Functions. CLI instalada como
  devDependency (`npx supabase ...` ou os scripts `npm run db:*`).
- Zod 4 (`z.toJSONSchema()` nativo — não precisa de `zod-to-json-schema`).
- Recharts (gráficos), Dexie (IndexedDB para fila offline).

## Como rodar local

```bash
npm run db:start   # sobe Postgres/Auth/Storage local via Docker (precisa do Docker Desktop rodando)
npm run db:types   # gera types/database.types.ts a partir do schema local
npm run dev
```

Login de desenvolvimento (criado pelo seed, só existe na stack local):
`rodrigoebsilva@gmail.com` / `treino123`.

`npm run db:reset` recria o banco do zero e roda as migrations +
`supabase/seeds/*.sql` (exercícios do free-exercise-db + esse usuário + anamnese +
treino PPL inicial).

## Decisões de arquitetura (não reabrir sem motivo)

- **Chaves de IA (Claude/Gemini) ficam no Supabase Vault**, nunca em Edge Function
  secrets — são por usuário, não globais do app. Acesso só via
  `vault_set_ai_key`/`vault_get_ai_key` (`SECURITY DEFINER`, escopadas a
  `auth.uid()`), chamadas pela Edge Function `gerar-treino` com o JWT do usuário.
- **`exercicios`**: `origem='base'` (seed, `user_id null`) vs `origem='usuario'`
  (criados no app). RLS de select libera as duas; insert/update/delete só a própria.
- **Um treino `ativo` por usuário** (`unique index ... where status = 'ativo'`) —
  trocar de treino é sempre arquivar o antigo + criar um novo, nunca editar o status
  do antigo "no meio do caminho".
- **`user_id` duplicado nas tabelas filhas** (`treino_dias`, `treino_exercicios`,
  `sessoes`, `sessao_series`, ...) em vez de RLS via join — decisão deliberada para
  manter as policies simples e os índices eficientes.
- **PWA com Turbopack**: service worker é uma *route* (`app/serwist/[path]/route.ts`),
  não um arquivo estático em `public/`. Ver `app/sw.ts` e `next.config.ts`.
  `SerwistProvider` precisa de `disable={NODE_ENV === "development"}` — sem isso o SW
  intercepta os assets do Turbopack/HMR e quebra a navegação em `next dev`.
- **Sem `cacheComponents`/`partialPrefetching`**: toda rota em `(app)` e `(auth)`
  depende de `cookies()` (sessão), então não existe shell estático que valha gerar.
- **Login só e-mail/senha** (não implementei magic link): mais simples pra single-user
  e pro seed de dev local; pode virar opção extra depois sem mudar o schema.
- **Anamnese nunca é sobrescrita**: editar sempre insere uma nova linha com
  `versao = max(versao)+1` (ver `app/(app)/perfil/actions.ts`); a policy de
  `update` na tabela existe só pra correção pontual, o app nunca usa.
- **shadcn/ui usa `@base-ui/react`** (não Radix): `Select.Value` só mostra o label
  certo se você passar uma função `children` mapeando valor→label (senão mostra o
  valor crú); `Button` com `render={<Link .../>}` precisa de `nativeButton={false}`.
- **Timer de descanso usa timestamp absoluto** (`Date.now() + segundos*1000` em
  `sessionStorage`), não um contador que decrementa — sobrevive a throttling de aba
  em segundo plano. Som (Web Audio), vibração e `Notification` disparam no
  `setTimeout`; isso não sobrevive a aba realmente encerrada pelo sistema (limite
  físico de PWA, documentado no plano da Fase 3).
- **`sincronizar()` (offline) tem uma trava de concorrência** (`lib/offline/sync.ts`):
  é chamada de 3 lugares (montar o layout, evento `online`, depois de cada
  série/treino concluído) — sem a trava, duas chamadas simultâneas liam a mesma
  sessão local sem `idRemoto` e criavam duas linhas remotas pra ela (bug real,
  encontrado testando). Só uma rodada roda por vez.
- **Dexie: todo campo usado em `.where(...)` precisa estar na lista de índices** do
  `db.version(n).stores({...})` — esquecer isso (aconteceu com `treinoDiaId`) dá um
  `SchemaError` silencioso em runtime, não em typecheck. Mudar o schema do Dexie
  exige subir a versão (`db.version(n+1).stores({...})`), nunca editar a versão já
  publicada.
- **Schema da IA (`TreinoGeradoSchema`) mora em `supabase/functions/_shared/schemas.ts`**,
  não em `lib/ai/`. A Edge Function `gerar-treino` (Deno) e o Next.js (Node) precisam
  do mesmo Zod schema; Deno resolve `"zod"` via `deno.json` (`npm:zod@^4`), Next
  resolve via `node_modules` — então o arquivo funciona nos dois runtimes sem
  nenhuma flag especial, **desde que não tenha import relativo pra outro arquivo**
  (Deno exige extensão `.ts` em import relativo; evitamos a dor de cabeça mantendo
  esse arquivo autocontido). `lib/ai/schemas.ts` é só um reexport +
  labels de UI. `tsconfig.json` exclui `supabase/functions/**` do typecheck do
  Next (código Deno, globals diferentes) — isso não impede o reexport de resolver,
  porque `exclude` só afeta o glob inicial, não imports transitivos.
- **Edge Functions usam um cliente Supabase escopado ao JWT de quem chamou**
  (`supabase/functions/_shared/user-client.ts`, repassando o header `Authorization`
  manualmente) — não o `@supabase/server`/`withSupabase` que o `supabase functions new`
  gera por padrão (esse vem configurado pra autenticação por apiKey
  publishable/secret, não pelo usuário logado). `verify_jwt = true` setado à mão em
  `config.toml` pros dois (`gerar-treino`, `listar-modelos`) — o scaffold cria com
  `false`.
- **`vault_set_ai_key` precisa usar `vault.update_secret` se já existe um secret_id**,
  nunca chamar `vault.create_secret` de novo com o mesmo nome — `vault.secrets.name`
  é único, e sempre usamos `<provedor>_key_<user_id>` como nome. Trocar a chave de
  um provedor já configurado dava erro de constraint única até essa correção (bug
  real, encontrado testando).
- **`aprovarTreino` não é atômico** (várias chamadas sequenciais ao Supabase, sem
  transação): se falhar no meio, o treino antigo já foi arquivado e o novo fica
  parcialmente criado. Risco aceito pra um app de usuário único — se acontecer,
  corrigir à mão via SQL local (apagar o treino quebrado, voltar o anterior pra
  `ativo`) é mais simples que construir uma RPC transacional pra isso agora.
- **Schema do Gemini (`responseSchema`) é um adaptador manual**
  (`_shared/providers/gemini-schema-adapter.ts`): converte o JSON Schema do zod pro
  subconjunto OpenAPI que a Gemini aceita (tipos em MAIÚSCULO, `nullable` como
  booleano em vez de union de tipos). Usar `z.toJSONSchema(schema, { reused: "inline" })`
  nos dois providers (Claude e Gemini) pra não lidar com `$ref`/`$defs`.

## Fases (uma por vez, com aprovação antes de começar a próxima)

0. ✅ Plano (schema, Edge Function, JSON da IA)
1. ✅ Setup: Next.js PWA, Supabase local, migrations, seed, tipos, este arquivo
2. ✅ Login e perfil/anamnese
3. ✅ Treino: visualização, edição manual, execução guiada, cronômetros, offline
4. ✅ IA: configurações, Edge Function, Claude + Gemini, prévia com diff
5. Evolução: medidas, fotos, gráficos, calendário
6. Deploy (Vercel + Supabase cloud) + instalação no celular

## Pendências conhecidas (não bloqueiam a fase atual)

- Nomes dos 876 exercícios do seed estão em inglês (vêm direto do
  free-exercise-db); tradução/ajuste para pt-BR é curadoria manual, incremental.
- `youtube_url` e `imagem_url` dos exercícios base estão `null` — curadoria manual
  (free-exercise-db não tem vídeo; as imagens dele podem ser copiadas para o Storage
  depois, não hotlink). Por isso o botão "Como executar" aparece desabilitado
  ("Vídeo não cadastrado") pra praticamente todo exercício por agora.
- Edição manual do treino (Fase 3) cobre só o nível de exercício (trocar, séries,
  reps, carga, descanso, ordem, método) — criar/remover dias inteiros ou arquivar o
  ciclo fica para quando a geração por IA (Fase 4) ou uma ação própria existir.
- Se a Edge Function falhar com erro de certificado TLS chamando a Anthropic/Gemini
  localmente (`invalid peer certificate: UnknownIssuer`), é o Kaspersky (ou outro
  antivírus com inspeção de HTTPS) interceptando o tráfego do Docker — nessa máquina
  foi transitório (sumiu depois de reiniciar o container do edge-runtime), mas se
  persistir não é bug do código.

## Regras de trabalho

- Fim de cada fase: lint + typecheck (+ testes quando existirem) + commit + resumo
  do que foi feito e como testar.
- Nunca commitar `.env.local` nem qualquer chave. `.env.example` é o único template
  versionado.
- Perguntar antes de decisões difíceis de reverter (mudar de stack, apagar dados,
  etc.) — ver histórico de decisões acima antes de propor mudança de arquitetura.
