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

## Fases (uma por vez, com aprovação antes de começar a próxima)

0. ✅ Plano (schema, Edge Function, JSON da IA)
1. ✅ Setup: Next.js PWA, Supabase local, migrations, seed, tipos, este arquivo
2. ✅ Login e perfil/anamnese
3. 🚧 Treino: visualização, edição manual, execução guiada, cronômetros, offline
4. IA: configurações, Edge Function, Claude + Gemini, prévia com diff
5. Evolução: medidas, fotos, gráficos, calendário
6. Deploy (Vercel + Supabase cloud) + instalação no celular

## Pendências conhecidas (não bloqueiam a fase atual)

- Nomes dos 876 exercícios do seed estão em inglês (vêm direto do
  free-exercise-db); tradução/ajuste para pt-BR é curadoria manual, incremental.
- `youtube_url` e `imagem_url` dos exercícios base estão `null` — curadoria manual
  (free-exercise-db não tem vídeo; as imagens dele podem ser copiadas para o Storage
  depois, não hotlink).
- `types/database.types.ts` é um placeholder até rodar `npm run db:types` com o
  Supabase local no ar.

## Regras de trabalho

- Fim de cada fase: lint + typecheck (+ testes quando existirem) + commit + resumo
  do que foi feito e como testar.
- Nunca commitar `.env.local` nem qualquer chave. `.env.example` é o único template
  versionado.
- Perguntar antes de decisões difíceis de reverter (mudar de stack, apagar dados,
  etc.) — ver histórico de decisões acima antes de propor mudança de arquitetura.
