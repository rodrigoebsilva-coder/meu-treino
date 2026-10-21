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

## Identidade visual

Paleta, tipografia e princípios flat/pill vêm do doc de identidade visual da SolIA
Labs (empresa do usuário) — não do prompt original. Tudo em `app/globals.css`
(tokens de cor light/dark) + `app/layout.tsx` (fonte). Resumo:
- Fundo branco/`#FAFAFB`, texto `#111827`, acento azul `#3B82F6` (hover
  `#1D4ED8`), secundários violeta `#7C5CFF` e ciano `#0E9AAE` — usados nos
  `--chart-*`. Modo escuro é extrapolado da mesma paleta (o doc da SolIA não
  especifica um dark theme completo).
- **Sem sombra, sem gradiente, nenhuma exceção**: `Card`/`Dialog`/`Select`/`Sheet`
  usam `border border-border` no lugar de `shadow-*`/`ring-*`. Qualquer componente
  shadcn novo que adicionar via `npx shadcn add` provavelmente vem com `shadow-*`
  por padrão — tirar na hora.
- **Botões são pill** (`rounded-full`, não `rounded-lg`) — mudança no
  `buttonVariants` base de `components/ui/button.tsx`, não só uma classe num botão
  específico.
- Títulos usam Space Grotesk (`font-heading`, carregada em `app/layout.tsx`);
  corpo usa a stack `system-ui`; mono (`font-mono`) é só a stack do sistema
  (`ui-monospace, Menlo, monospace`), sem Google Font — a SolIA não pede uma fonte
  mono customizada.
- Ícones do PWA (`public/icons/*.png`) e `theme_color` usam o azul `#3B82F6`.

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

## Produção

- App: https://meu-treino-drab-delta.vercel.app (Vercel, projeto
  `rodrigoebsilva-coders-projects/meu-treino`)
- Supabase cloud: projeto `bmijwtwtnhzyrdusnmak` (região us-west-2)
- `supabase/seeds/*.sql` **nunca** rodam em cloud (`db push` só aplica migrations) —
  só a base de exercícios (`01_exercicios.sql`) foi enviada manualmente via
  `supabase db query --linked -f supabase/seeds/01_exercicios.sql`. Os seeds
  `02_usuario_dev.sql`/`03_treino_inicial.sql` são só pra stack local — **nunca**
  rodar em produção (criam um usuário com senha fraca conhecida).
- Usuário de produção criado à mão pelo dashboard (Authentication → Users), com
  "Allow new users to sign up" desligado — o app não tem tela de cadastro público
  de propósito (single-user).
- Deploy é via CLI (`npx vercel --prod`), não auto-deploy por push: o `vercel link`
  não conseguiu conectar o repo GitHub automaticamente (precisa autorizar o GitHub
  App do Vercel no dashboard primeiro, em Project Settings → Git). Rodar
  `npx vercel git connect` depois de autorizar, se quiser deploy automático.
- Pra reaplicar migrations/functions em cloud depois de mudanças locais:
  `npx supabase db push` e `npx supabase functions deploy <nome>` (projeto já
  linkado via `supabase link --project-ref bmijwtwtnhzyrdusnmak`).

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
- **`medidas` é "um registro por dia" (`unique (user_id, registrado_em)`), salvo via
  `upsert`** — mas `upsert` substitui a linha inteira. Salvar só o peso num dia que já
  tinha cintura/peito/braço preenchidos zerava esses campos (bug real, encontrado
  testando). `salvarMedida` busca a linha existente daquele dia primeiro e mescla os
  campos não enviados antes do upsert — qualquer outro upsert parcial nessa tabela
  precisa do mesmo cuidado.
- **Fotos de progresso**: upload é client-side direto pro Storage
  (`supabase.storage.from("fotos-progresso").upload(...)`, não via server action —
  arquivo grande não passa bem por FormData de server action), path
  `<user_id>/<arquivo>` (a RLS do bucket exige isso). Exibição usa
  `createSignedUrl` gerada no server component (bucket é privado); `next/image` com
  `unoptimized` pra não precisar configurar `remotePatterns` pra um host que muda a
  cada ambiente (local vs. cloud).
- **`dica_casa` (alternativa de exercício pra treinar em casa) mora em `exercicios`**,
  não em `treino_exercicios` — é propriedade do exercício em si (qualquer treino que
  use esse exercício herda a dica), não da instância dentro de um treino específico.
  Curadoria dos 30 exercícios do PPL seedado fica em
  `supabase/seeds/04_dica_casa.sql`, **não na migration**: migrations rodam antes dos
  seeds no `db reset` local, e os 876 exercícios só existem depois que
  `01_exercicios.sql` roda — um `UPDATE` na migration não acharia nenhuma linha (bug
  real, encontrado testando; a migration 0007 só faz o `ALTER TABLE ADD COLUMN`).
- **Editar `dica_casa` pelo app usa uma função `SECURITY DEFINER`**
  (`atualizar_dica_casa`, migration 0008), não um `UPDATE` direto client-side: a RLS de
  `exercicios` só libera update pra `origem='usuario'`, e a maioria dos exercícios é
  `origem='base'` (seed). Mesmo padrão das funções do Vault — só altera essa coluna,
  nunca nome/grupo_muscular/etc.
- **Preferências de timer (som/vibração ao fim do descanso) ficam em `localStorage`**
  (`lib/preferencias/timer.ts`), não no banco — é ajuste por aparelho, não dado do
  usuário. Lidas com a mesma convenção de inicializador `useState` preguiçoso do timer
  (evita `useEffect` + `set-state-in-effect` do ESLint).
- **Timer de descanso em tela cheia** (`rest-timer-overlay.tsx`) substituiu a barra
  fixa no rodapé: anel circular SVG (`strokeDashoffset` sobre a circunferência) +
  contagem grande + botão "+15s". `estender()` no hook soma aos dois, `endsAt` e
  `duracaoTotal` (guardados em `sessionStorage`), pra o anel não saltar — sem isso o
  progresso visual ficaria incoerente com o tempo restante depois de estender.
- **Check-in (energia/sono/dor/notas) fica em `sessoes`**, não numa tabela própria —
  sempre ligado a um treino específico, o que permite cruzar "dormi mal" com o
  desempenho registrado naquele treino. Capturado uma vez por sessão, antes da
  primeira série: `execucao-client.tsx` só cria a `SessaoLocal` (Dexie) depois que o
  `CheckinDialog` é respondido ou pulado — `iniciadaEm`/o cronômetro da sessão
  começam nesse momento, não no load da página. Pular preenche os 4 campos com null
  (não é obrigatório).
- **View com `select *` não acompanha `ALTER TABLE` automaticamente**: Postgres
  expande o `*` de uma view pra lista de colunas no momento em que ela é criada, não
  dinamicamente. Adicionar `meta_peso_kg`/`meta_prazo` em `anamneses` (migration
  0010) não apareceu em `anamnese_atual` até rodar `create or replace view` com o
  mesmo texto (migration 0011) — bug real, encontrado testando (a checagem de
  realismo da meta nunca aparecia). Qualquer `alter table` futuro numa tabela que
  tenha uma view `select *` por cima precisa do mesmo `create or replace view` junto.
- **Checagem de realismo da meta** (`lib/perfil/meta.ts`, `avaliarMeta()`): compara o
  ritmo kg/semana pedido (peso-alvo vs. peso atual, dividido pelas semanas até
  `meta_prazo`) contra uma heurística de ritmo seguro (~1%/semana do peso corporal
  pra perda, ~0,5%/semana pra ganho — teto biológico menor). Até 1,5x o ritmo seguro
  ainda conta como realista. "Peso atual" é a medida mais recente em `medidas`, com
  fallback pro `peso_inicial_kg` da anamnese se não houver nenhuma medida registrada.

## Fases (uma por vez, com aprovação antes de começar a próxima)

0. ✅ Plano (schema, Edge Function, JSON da IA)
1. ✅ Setup: Next.js PWA, Supabase local, migrations, seed, tipos, este arquivo
2. ✅ Login e perfil/anamnese
3. ✅ Treino: visualização, edição manual, execução guiada, cronômetros, offline
4. ✅ IA: configurações, Edge Function, Claude + Gemini, prévia com diff
5. ✅ Evolução: medidas, fotos, gráficos, calendário
6. ✅ Deploy (Vercel + Supabase cloud) + instalação no celular

Fases 7–11 abaixo vieram da análise de https://mt-rodrigo.netlify.app (outro app de
treino, também criado com Claude): catalogar os recursos que ele tem e esse app não
tem, e trazer pra cá **sem remover nada do que já existe** (pedido explícito do
usuário). Mesmo padrão: uma fase de cada vez, com aprovação antes da próxima.

7. ✅ Execução: timer de descanso em tela cheia (+15s), toggles de som/vibração,
   dica de alternativa em casa por exercício
8. ✅ Check-in completo: energia/sono/dor/notas no check-in, checagem de
   realismo da meta
9. ⬜ Dashboard "Hoje": progresso semanal + relatório exportável (PDF via print)
10. ⬜ Ajustes: exportar/importar dados, apagar todos os dados, aviso legal/médico
11. ⬜ Mesociclo: periodização de 12 semanas, calendário prospectivo, regeneração
    automática do plano pela IA ao fim do ciclo (mais estrutural, fica por último)

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
