# Meu Treino — Detalhamento do projeto (para auditoria externa)

> Gerado em 2026-10-27 a partir do código-fonte, `CLAUDE.md` e do plano técnico da
> Fase 0, para servir de contexto a uma ferramenta de auditoria externa (Antigravity).
> Não é documentação de usuário — é um mapa técnico do que existe e por quê.

## 1. O que é o projeto

App de treino pessoal (academia), hoje usado por um grupo pequeno (dono +
aluno(s)/professor), com plano de treino gerado e ajustado por IA (Claude ou
Gemini). PWA instalável no celular, funciona offline durante a execução de um
treino.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, TailwindCSS v4, shadcn/ui (base-ui, não Radix) |
| PWA | `@serwist/turbopack` — service worker como *route* (`app/serwist/[path]/route.ts`), não arquivo estático |
| Backend/dados | Supabase: Postgres, Auth, RLS, Storage, Edge Functions (Deno), Vault |
| Validação/contrato | Zod 4 (`z.toJSONSchema()` nativo) |
| Gráficos | Recharts |
| Offline | Dexie (IndexedDB), fila de sincronização própria |
| IA | Claude (Anthropic) e Gemini (Google), chave por usuário no Supabase Vault |

Deploy: Vercel (app) + Supabase Cloud (projeto `bmijwtwtnhzyrdusnmak`, região
us-west-2). Deploy manual via CLI (`npx vercel --prod` / `npx supabase db push`),
sem CI/CD automático.

## 3. Estrutura de pastas (nível relevante)

```
app/
├── (auth)/login/                  # login e-mail/senha (sem cadastro público)
├── (app)/                         # grupo autenticado, layout com bottom nav
│   ├── page.tsx                   # dashboard "Hoje"
│   ├── treino/
│   │   ├── page.tsx               # visão + edição manual do treino ativo
│   │   ├── gerar-ia/              # geração/ajuste de treino via IA, prévia+diff
│   │   ├── executar/[treinoDiaId]/ # execução guiada (timers, check-in, Smart Swap)
│   │   └── historico/             # calendário de sessões
│   ├── evolucao/{medidas,fotos}/  # gráficos, medidas corporais, fotos de progresso
│   ├── perfil/                    # dados de cadastro, anamnese (versionada), métricas
│   ├── configuracoes/
│   │   ├── ia/                    # provedor/modelo/chave de IA
│   │   ├── dados/                 # export/import JSON, apagar tudo
│   │   └── usuarios/              # admin: atribuir cargo (admin/professor/aluno)
│   ├── aviso-legal/
│   └── relatorio/                 # relatório imprimível (window.print)
├── serwist/[path]/route.ts        # service worker (PWA)
└── ~offline/                      # fallback offline do Serwist

lib/
├── ai/            # schemas Zod + tipos do contrato de geração de treino
├── dados/         # schemas de export/import
├── dashboard/      # agregações pro dashboard "Hoje" e relatório
├── evolucao/      # peso/medidas, resumo semanal
├── mesociclo/     # periodização (fases determinísticas, não-IA)
├── offline/       # Dexie (db.ts) + fila de sync
├── perfil/        # anamnese, dados de cadastro, IMC/TMB, realismo de meta
├── preferencias/  # preferências de timer (localStorage)
├── supabase/      # clientes (browser/server)
└── treino/        # tipos do treino, Smart Swap (alternativas determinísticas)

supabase/
├── migrations/     # 0001–0016 (ver seção 5)
├── functions/
│   ├── _shared/     # schemas Zod compartilhados, adapters, cliente por-JWT
│   ├── gerar-treino/  # chama Claude ou Gemini, valida, grava geracoes_ia
│   └── listar-modelos/ # lista modelos disponíveis por provedor
└── seeds/          # exercícios (free-exercise-db), usuário dev, treino inicial,
                     # dica_casa, admin dev — só rodam local, exceto 01_exercicios.sql
```

## 4. Modelo de dados (visão geral)

Convenção geral: toda tabela de dado pessoal tem `user_id` (RLS "dono vê só o que é
dele"), duplicado nas tabelas filhas em vez de RLS via join — decisão deliberada
para manter policies simples e índices eficientes.

| Tabela | Papel |
|---|---|
| `perfis` | Cargo (admin/professor/aluno, só rótulo hoje), dados de cadastro |
| `anamneses` | Versionada (nunca sobrescrita), inclui medidas corporais + meta |
| `anamnese_atual` | View (`select *` + `distinct on`) da versão mais recente por usuário |
| `exercicios` | Base (seed, ~876 do free-exercise-db) + próprios do usuário |
| `treinos` / `treino_dias` / `treino_exercicios` | Plano ativo (1 ativo por usuário, unique index) |
| `treino_exercicio_alternativas` | Smart Swap — 2 alternativas por exercício, calculadas na criação do plano |
| `sessoes` / `sessao_series` | Execução real (inclui check-in e `exercicio_realizado_id` quando houve troca) |
| `medidas` | 1 registro por dia (peso, cintura, etc.) |
| `fotos_progresso` | Metadados; arquivo no Storage (bucket privado) |
| `config_ia` / `geracoes_ia` | Config de IA por usuário + auditoria de cada geração (sucesso/erro) |

Vault: `vault_set_ai_key` / `vault_get_ai_key` (SECURITY DEFINER, escopadas a
`auth.uid()`) guardam a chave Claude/Gemini de cada usuário — nunca em Edge
Function secrets (que são globais, não por usuário).

### Migrations (ordem cronológica)

`0001` perfis/anamneses · `0002` exercícios · `0003` treinos · `0004` sessões ·
`0005` evolução (medidas/fotos) · `0006` IA (config, Vault, geracoes_ia) ·
`0007`/`0008` dica_casa (alternativa pra treinar em casa) · `0009` check-in na
sessão · `0010` meta na anamnese · `0011` recria view `anamnese_atual` (Postgres
não atualiza `select *` sozinho) · `0012` policy de delete em anamneses (pro
"apagar tudo") · `0013` mesociclo · `0014` tabela `perfis` + cargo + trigger em
`auth.users` · `0015` medidas corporais na anamnese (+ recria a view de novo) ·
`0016` Smart Swap (`treino_exercicio_alternativas`, `exercicio_realizado_id`).

## 5. Decisões de arquitetura (resumo — detalhe completo em `CLAUDE.md`)

- **IA não decide tudo**: mesociclo (fases) e Smart Swap (alternativas de
  exercício) são regras determinísticas no código, não pela IA — evita tocar no
  contrato JSON compartilhado (`TreinoGeradoSchema`) que já funciona em produção.
- **Schema da IA é autocontido** em `supabase/functions/_shared/schemas.ts` (sem
  imports relativos) pra funcionar tanto no Deno (Edge Function) quanto no Node
  (Next.js) sem flags especiais.
- **Edge Functions usam um cliente Supabase escopado ao JWT do usuário**
  (repassado manualmente), não o scaffold padrão (que é pensado pra apiKey, não
  usuário logado).
- **RLS recursiva** (`perfis` verificando se é admin via subquery na própria
  tabela) é resolvida com função `SECURITY DEFINER` (`sou_admin()`), não inline na
  policy — senão recursão infinita.
- **Troca de exercício ("aparelho ocupado")** vale só pra sessão do dia —
  `treino_exercicios` (o plano) nunca é editado por isso; o que foi feito de fato
  fica em `sessao_series.exercicio_realizado_id`.
- **Offline-first simples**: fila de escrita local (Dexie) com lock de
  concorrência em `sincronizar()` — não é sync bidirecional complexo, porque é uso
  single-user/poucos usuários sem edição concorrente real.
- **Export/import de dados é JSON próprio**, não dump de tabelas; remapeia todo
  id na importação pra nunca colidir com o que já existe.
- Lista completa de decisões, bugs encontrados e correções: ver seção "Decisões de
  arquitetura (não reabrir sem motivo)" em [CLAUDE.md](CLAUDE.md).

## 6. Segurança / dados sensíveis

- Autenticação: Supabase Auth, só e-mail/senha, sem cadastro público (contas
  criadas manualmente no dashboard do Supabase).
- RLS habilitado em toda tabela de dado pessoal; `exercicios` libera select da
  base pra todos, mas insert/update/delete só do próprio.
- Chaves de IA (Claude/Gemini) ficam encriptadas no Supabase Vault, nunca em
  texto puro em tabela nem em variável de ambiente compartilhada.
- `.env.local` nunca é commitado; `.env.example` é o único template versionado.
- Bucket de fotos de progresso é privado; acesso via `createSignedUrl` gerado no
  server.

## 7. Estado atual / pendências conhecidas

- Fases 0–13 do roteiro original concluídas (ver "Fases" em `CLAUDE.md`).
- Nomes dos exercícios do seed estão em inglês (curadoria manual pendente,
  incremental).
- `imagem_url` da base de exercícios está `null` (curadoria manual pendente).
- `aprovarTreino` e o fluxo de import de dados não são atômicos (risco aceito
  para um app de poucos usuários — recuperação manual via SQL se falhar no meio).
- `perfis.cargo` é só rótulo hoje — não há RLS cruzada entre professor e aluno.

## 8. Como rodar / contexto de deploy

Ver seções "Como rodar local" e "Produção" em [CLAUDE.md](CLAUDE.md) (comandos de
setup, credenciais de dev local, URLs de produção). Este documento não repete
esses comandos para não divergir de uma fonte única de verdade.

---

*Este arquivo é um snapshot para fins de auditoria. A fonte viva da arquitetura
é `CLAUDE.md`; se este documento e o `CLAUDE.md` divergirem no futuro, o
`CLAUDE.md` prevalece.*
