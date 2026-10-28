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
- **Sombra leve é permitida, de propósito** (revisto out/2026, pedido explícito do
  usuário pra dar "cara de app de academia"): `Card`/`Dialog`/`Sheet`/`Select` usam
  `shadow-sm`/`shadow-md`/`shadow-lg` + `border border-border` (as duas coisas juntas,
  não uma ou outra) e cantos mais arredondados (`rounded-2xl` em vez de `rounded-xl`
  nos cards/modais). O botão primário (`variant="default"`) tem uma sombra colorida
  sutil (`shadow-primary/30`) pra parecer "levantado". **Ainda sem gradiente** — isso
  continua valendo. Qualquer componente shadcn novo que adicionar via
  `npx shadcn add` provavelmente já vem com `shadow-*` por padrão agora — então, ao
  contrário de antes, **não precisa tirar** na hora, só confirmar que combina com o
  resto (sombra discreta, não dramática).
- **Emoji nos títulos de página é de propósito**, parte do mesmo pedido de "cara de
  app de academia" (💪 Treino, 📈 Evolução, 🎯 Mesociclo, 🔥 streak em laranja — a
  única cor quente fora da paleta azul/violeta/ciano, reservada só pro streak).
  Páginas sérias (aviso legal) ficam sem emoji de propósito.
- **Botões são pill** (`rounded-full`, não `rounded-lg`) — mudança no
  `buttonVariants` base de `components/ui/button.tsx`, não só uma classe num botão
  específico.
- Títulos usam Space Grotesk (`font-heading`, carregada em `app/layout.tsx`);
  corpo usa a stack `system-ui`; mono (`font-mono`) é só a stack do sistema
  (`ui-monospace, Menlo, monospace`), sem Google Font — a SolIA não pede uma fonte
  mono customizada.
- Ícones do PWA (`public/icons/*.png`) e `theme_color` usam o azul `#3B82F6`. O
  ícone é o dumbbell do lucide (mesmo da bottom nav) em branco sobre o azul —
  gerado a partir de `public/icons/icon-source.svg` via `sharp` (script inline,
  não precisa de ferramenta externa pra reexportar nos tamanhos certos se o
  logo mudar: 192/512/180 + `app/icon.png` do favicon, 32x32). `app/favicon.ico`
  (o ícone genérico do Next.js) foi removido — `app/icon.png` é a convenção de
  arquivo especial do App Router que substitui ele.

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
- **Reordenar exercícios é clica-e-arrasta (`@dnd-kit/core`+`sortable`+`utilities`)**,
  não mais os botões de seta cima/baixo da Fase 3 — reverte aquela decisão a pedido
  explícito do usuário ("não tá funcionando bem"). `DndContext`+`SortableContext` em
  `treino-dia-card.tsx`, com `PointerSensor` (funciona com mouse e touch) e um
  `activationConstraint: { distance: 8 }` pra não brigar com o tap de
  expandir/colapsar o card nem com o scroll da página — só a alcinha
  (`GripVertical`, `touch-none`) inicia o arrasto, o resto da linha não. O servidor
  (`reordenarExercicios`, uma lista inteira de ids de uma vez) sempre regrava `ordem`
  em duas passadas (negativa temporária, depois final) pra nunca colidir com a unique
  constraint `(treino_dia_id, ordem)` no meio do caminho. **Testar automação de
  drag-and-drop via `left_click_drag` não funciona** (não gera `pointermove`
  suficiente pro `PointerSensor` ativar) — testar via `javascript_tool` disparando
  `PointerEvent`s manualmente (pointerdown → vários pointermove incrementais →
  pointerup).
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
- **"Próximo dia" não é agenda por dia da semana** — é só o dia seguinte, na ordem do
  ciclo (`treino_dias.ordem`), ao último treino finalizado (`buscarProximoDia` em
  `lib/dashboard/dados.ts`). Sem nenhum treino finalizado ainda, sugere o primeiro dia.
  O usuário treina quando pode, dentro dos dias disponíveis da anamnese — não força
  "treino de segunda" vs. "treino de terça".
- **Relatório exportável (`/relatorio`) é HTML com `window.print()`**, não uma lib de
  PDF nova — período é desde o início do ciclo ativo (`treinos.criado_em`) até hoje
  (sem ciclo ativo, últimos 90 dias), pra sempre refletir o bloco de treino em
  andamento em vez de uma janela fixa arbitrária. `print:hidden` no `BottomNav` e no
  botão "Exportar PDF" esconde a navegação do app na hora de imprimir/exportar.
- **Export/import de dados (`/configuracoes/dados`) é JSON próprio, não um dump de
  tabelas** — fotos de progresso ficam de fora (binário no Storage, não cabe bem num
  JSON; documentado na própria tela). Export é uma Route Handler (`exportar/route.ts`,
  não Server Action) pra poder setar `Content-Disposition: attachment` e devolver um
  download de verdade. Import remapeia todo id (exercícios do usuário, dias, 
  exercícios-de-treino) pra não colidir com o que já existe no banco — nunca reusa o id
  original. **Treino importado sempre entra `arquivado`**, exceto quando não existe
  nenhum treino `ativo` no momento E existe exatamente um candidato `ativo` no
  arquivo (aí ele volta a ficar ativo) — evita tanto esbarrar na unique constraint de
  "um ativo por vez" quanto trocar o treino em uso silenciosamente num import de
  mescla. `medidas` usa `upsert` (mesma chave `user_id, registrado_em` do app);
  `anamneses` é sempre inserida como versão nova, numerada depois da versão atual —
  nunca sobrescreve. Import não é atômico (mesmo risco aceito do `aprovarTreino`):
  uma sequência de inserts, sem RPC transacional.
- **Mesociclo é regra fixa no app, não decidido pela IA** (`lib/mesociclo/fases.ts`):
  duração em semanas escolhida pelo usuário só ao gerar um **novo ciclo** (default
  12), e as fases (Acumulação/Intensificação/Deload) saem de uma heurística fixa
  (~60% acumulação, ~25% intensificação, ~15% deload, mínimo 1 semana cada). Decisão
  deliberada pra não mexer no contrato JSON compartilhado entre Next.js e a Edge
  Function (`supabase/functions/_shared/schemas.ts`) que já funciona em produção.
- **`treinos.duracao_semanas` + `criado_em` representam o relógio do mesociclo, não
  de cada linha de `treinos`** — como toda aprovação de proposta da IA cria uma linha
  nova em `treinos` (arquivando a anterior, mesmo pra "ajustar"/"progressão de
  cargas"/"adaptar pra casa"), `aprovarTreino` só reseta `criado_em` pra agora e pede
  a duração de novo quando o tipo de ação é **"novo ciclo"**; qualquer outro tipo de
  ação herda `criado_em`/`duracao_semanas` do treino que está sendo substituído, pra
  continuar contando a semana certa do mesmo mesociclo em vez de reiniciar o relógio
  a cada ajuste pontual.
- **"Calendário prospectivo" é uma lista dos próximos dias na ordem do ciclo, sem
  datas** (`buscarProximosDias` em `lib/dashboard/dados.ts`) — o app não sabe em qual
  dia da semana o usuário treina (decisão da Fase 3: "treina quando pode"), então
  projetar datas de verdade seria inventar uma agenda que não existe. Mostra só a
  sequência (ex.: "Legs A · Push B · Pull B..."), não um grid de calendário.
- **Regeneração do plano ao fim do mesociclo é via CTA, não automática em segundo
  plano** — não tem cron configurado no projeto (Supabase `pg_cron` ou similar), e
  criar essa infra só pra isso seria desproporcional pra um app de usuário único. Em
  vez disso, o dashboard "Hoje" detecta `semana > duracao_semanas` e mostra um
  botão "Gerar novo ciclo" (`/treino/gerar-ia?tipoAcao=novo_ciclo`, que pré-seleciona
  o tipo de ação — sem esse parâmetro o form.default pra "ajustar" quando já existe
  um treino ativo).
- **"Apagar todos os dados" precisou de uma policy de `delete` nova em `anamneses`**
  (migration 0012) — a tabela não tinha nenhuma (decisão deliberada da 0001: "nunca
  apagada" pelo fluxo normal do app). Sem a policy, o apagar-tudo falhava *em
  silêncio* só nessa tabela via RLS (bug real, encontrado testando: sobrava 1 linha
  depois de "apagar tudo"). A policy nova é restrita ao próprio dono e só serve pra
  esse reset completo explícito — o app continua nunca chamando `delete` em
  `anamneses` em nenhum outro fluxo. "Apagar tudo" cobre anamnese/treinos/sessões/
  medidas/fotos/exercícios próprios; **não mexe em `config_ia` nem nas chaves de IA
  no Vault** — é reset de dado de treino/saúde, não de conta.
- **`perfis` (cargo admin/professor/aluno) é só um rótulo, sem RLS cruzada** — pedido
  explícito do usuário antes de implementar (ver pergunta de escopo na Fase 12 do
  plano). "Professor" não vê/edita dado de aluno nenhum; todas as outras tabelas
  continuam com RLS "dono vê só o que é dele", sem alteração. Contas continuam
  criadas à mão no dashboard do Supabase — o app só tem uma tela de admin pra
  **atribuir cargo** a quem já existe, não pra criar usuário.
- **Função `SECURITY DEFINER` pra quebrar recursão de RLS "é admin?"**: uma policy de
  `perfis` que faz `exists (select 1 from perfis where ... cargo = 'admin')` direto
  recursiona infinitamente (a subquery dispara a mesma policy de novo, que dispara de
  novo...) — erro real, encontrado testando ("infinite recursion detected in policy").
  A correção é sempre colocar esse tipo de checagem autorreferente numa função
  `security definer` (`sou_admin()`), nunca inline na policy.
- **Trigger em `auth.users` cria a linha de `perfis` automaticamente** no insert
  (`criar_perfil_novo_usuario`, cargo default `'aluno'`) — não existia nenhum trigger
  ali antes. O bootstrap do primeiro admin (por e-mail, `rodrigoebsilva@gmail.com`)
  roda dentro da migration 0014 **e também** num seed novo
  (`supabase/seeds/05_admin_dev.sql`) — mesma pegadinha de migration-antes-de-seed já
  documentada pra `dica_casa`: o usuário dev só existe depois que
  `02_usuario_dev.sql` roda, então o bootstrap da migration sozinho não encontra
  ninguém pra promover em ambiente local (funciona direto em produção, onde o usuário
  real já existe antes do `db push`).
- **O trigger que protege a troca de cargo deixa passar quando `auth.uid()` é nulo**
  (contexto de migration/seed/service role, sem JWT de usuário) — é o que permite o
  bootstrap do primeiro admin rodar sem travar nele mesmo; uma chamada de usuário real
  sempre tem `auth.uid()` preenchido, então isso não abre brecha pra ninguém se
  autopromover pela API.
- **Smart Swap (alternativas de exercício) é regra determinística, não pela IA** —
  mesmo raciocínio do mesociclo: `escolherAlternativas` (`lib/treino/alternativas.ts`)
  filtra `exercicios` por mesmo `grupo_muscular` e `equipamento` diferente, sem tocar
  no contrato JSON da IA. Calculado (2 por exercício) já na aprovação do plano
  (`aprovarTreino` chama `gerarAlternativasParaTreino`), com um backfill/rede de
  segurança em `treino/page.tsx` (roda só se faltar alguma — barato depois da
  primeira vez) pra cobrir treinos de antes dessa feature e exercícios adicionados
  manualmente.
- **Troca de exercício ("aparelho ocupado?") vale só pra sessão do dia, nunca edita
  `treino_exercicios`** — decisão explícita do usuário: o plano continua com o
  exercício original pras próximas vezes que o dia repetir. `sessao_series` ganhou
  `exercicio_realizado_id` (nullable — null é o caso comum, "fez o planejado") pra
  guardar o que foi feito de fato, separado do que estava no plano. O estado de qual
  alternativa está em uso fica só na memória do componente de execução
  (`execucao-client.tsx`), nunca persistido fora da série em si.

- **Chave de IA compartilhada + cota de gerações** (migration 0018): usuário que não é
  admin não configura chave — a Edge Function `gerar-treino` usa provedor/modelo/chave
  do primeiro admin (`vault_get_chave_compartilhada`, só `service_role`) e ignora o que
  vier no corpo da requisição. Cada usuário comum tem 1 geração (`cota_ia.creditos`;
  sem linha = 1); o admin libera +1 por usuário em `/configuracoes/usuarios`
  (`liberar_geracao`, checa `sou_admin()`). Consumo/devolução (`consumir_geracao`/
  `devolver_geracao`) são `service_role`-only e chamados pela função depois de validar o
  JWT, nunca pelo cliente — senão o usuário se daria créditos. Crédito é consumido antes
  da chamada à IA e devolvido se a geração falhar. "Pedir ajuste" (2ª chamada à IA) fica
  oculto pra quem usa a chave compartilhada; o ajuste é manual em `/treino`. Admin usa a
  própria chave e é ilimitado. `aprovarTreino` lê o provedor de `geracoes_ia` (o cliente
  não sabe qual foi usado).

- **Sessão aberta há mais de 5h é resolvida sozinha** (`lib/offline/sync.ts`,
  `resolverSessoesAbandonadas`, roda a cada `sincronizar()`): sem séries é cancelada
  (apaga local e remota); com séries é encerrada na hora da última série. A tela de
  execução ignora sessões abandonadas ao decidir se reaproveita uma em andamento.
- **Séries concluídas são editáveis e podem ser desmarcadas**: editar reenvia via `upsert`
  (mesmo `idLocal`); desmarcar uma já sincronizada marca `removida` no Dexie e o sync apaga
  a linha remota e depois a local (não sincronizada: apaga local direto). Carga/reps digitadas
  numa série replicam pras seguintes (e pras anteriores ainda vazias); o valor do último treino
  vem preenchido de verdade (não mais só placeholder).
- **Descanso configurável por aparelho** (`preferenciasTimer.getDescanso`, localStorage,
  em Config): se definido, vale no lugar do `descanso_segundos` de cada exercício.
- **Listas de exercícios/modelos usam `SelectBusca`** (`components/ui/select-busca.tsx` +
  `lib/busca.ts`): busca sem acento que tolera erro de digitação. Enums curtos continuam no `Select`.
- **Cardio é medido por tempo** (migration 0019): `exercicios.tipo` ('forca'|'cardio'),
  `treino_exercicios.duracao_minutos`, `sessao_series.duracao_segundos`. Cardio guarda
  `series=1`, reps 1-1, descanso 0 só pra satisfazer os NOT NULL. A IA recebe `tipo` no
  catálogo e devolve `duracao_minutos` (campo opcional novo no schema compartilhado);
  Smart Swap só troca cardio por cardio; "Carga por exercício" não lista cardio. Os
  exercícios base de cardio são marcados por nome na migration (vale em produção) **e** em
  `seeds/06_cardio.sql` (migration roda antes do seed no `db reset` local).
- **Personal SolIA** (`components/personal-solia.tsx`) é o avatar em pixel art (SVG de
  retângulos) que conduz o primeiro acesso.

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
9. ✅ Dashboard "Hoje": progresso semanal + relatório exportável (PDF via print)
10. ✅ Ajustes: exportar/importar dados, apagar todos os dados, aviso legal/médico
11. ✅ Mesociclo: periodização configurável em semanas, calendário prospectivo,
    aviso + CTA de regeneração do plano ao fim do ciclo (mais estrutural, fica por
    último)
12. ✅ Multiusuário: cargo (admin/professor/aluno) por conta, dados de cadastro
    (nome/data de nascimento/telefone), medidas corporais + IMC/TMB na anamnese,
    cards de treino colapsáveis
13. ✅ Smart Swap: alternativas de exercício (aparelho ocupado) prontas desde a
    elaboração do plano, troca só vale pra sessão do dia
14. ✅ Auditoria e blindagem: migration 0017 (proteção de atualizar_dica_casa e Vault),
    idempotência com idLocal e upsert no sync offline, fallback de carga/reps na
    execução, sincronização do schema de backup com migrations 15/16, cabeçalho seguro
    x-goog-api-key na Gemini, validação de prefixo em fotos, fuso de Brasília no
    Streak e catálogo de exercícios + check-in no contexto da IA (ver detalhes e
    próximos passos em [HANDOFF-FASE-14.md](HANDOFF-FASE-14.md))

15. ✅ Chave de IA compartilhada (do admin) + 1 geração por usuário, liberada pelo admin

16. ✅ Ajustes pós-uso: execução editável, descanso configurável, busca nas listas, Personal SolIA, cardio por tempo

## Pendências conhecidas (não bloqueiam a fase atual)

- Nomes dos 876 exercícios do seed estão em inglês (vêm direto do
  free-exercise-db); tradução/ajuste para pt-BR é curadoria manual, incremental.
- `imagem_url` dos exercícios base está `null` — curadoria manual (as imagens do
  free-exercise-db podem ser copiadas pro Storage depois, não hotlink).
  `youtube_url` também está `null` pra quase todo exercício, mas não bloqueia mais o
  botão de vídeo: `ExercicioVideoButton` (`app/(app)/treino/exercicio-video-button.tsx`,
  usado em `treino-dia-card.tsx` e na execução guiada) abre o vídeo embutido quando
  `youtube_url` existe, e senão vira um link pra uma busca no YouTube pelo nome do
  exercício (`lib/treino/types.ts`, `youtubeBuscaUrl`) — cobre todo mundo sem precisar
  de curadoria manual.
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
