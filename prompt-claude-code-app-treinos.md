# Prompt para Claude Code — App de Treino Pessoal com IA (v1 de validação)

> Como usar: crie uma pasta vazia, abra o Claude Code nela, ative o **modo plano** (Shift+Tab) e cole tudo a partir de "INÍCIO DO PROMPT".

---

## INÍCIO DO PROMPT

Você vai construir um **app de treino pessoal** para eu usar sozinho e validar a ideia. Não existe área de professor nesta versão. O diferencial é que **o treino é gerado e atualizado por IA** (Claude ou Gemini), a partir do meu perfil e do meu histórico. Leia tudo antes de agir. **Não escreva código de aplicação até eu aprovar o plano da Fase 0.**

### 1. Visão geral

- Usuário único: eu. Mesmo assim, modele os dados com `user_id` e RLS, para no futuro virar multiusuário (e ganhar área de professor) sem refazer o banco.
- Uso principal: **celular, na academia**. Prioridade total para UX mobile.
- Idioma: português (pt-BR).

### 2. Stack

- **Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui**, como **PWA instalável** (iOS e Android), deploy na **Vercel**
- **Supabase:** Postgres, Auth (só meu login, e-mail/senha ou magic link), RLS, Storage (fotos de progresso), Edge Functions
- Tipos gerados com `supabase gen types`; validação com Zod
- Gráficos com Recharts
- Se achar que outra opção é melhor para algum ponto, pergunte antes de trocar.

### 3. Integração com IA (ponto central do app)

**Como conectar:** o app não usa o login do site claude.ai nem do gemini.google.com, porque essas assinaturas não liberam acesso para apps próprios. A conexão é feita por **chave de API**:
- **Claude:** chave da Anthropic API (console.anthropic.com)
- **Gemini:** chave do Google AI Studio (aistudio.google.com)

Requisitos:
- Tela **Configurações → IA**: escolher o provedor (Claude ou Gemini), o modelo e cadastrar/testar a chave. Liste os modelos disponíveis consultando a API de cada provedor (não deixe nomes de modelo fixos no código).
- As chaves ficam **somente no servidor** (Supabase Edge Function secrets ou tabela criptografada com Supabase Vault). Nunca no navegador, nunca no repositório.
- Todas as chamadas à IA passam por uma Edge Function `gerar-treino`, atrás de uma interface comum `AIProvider` (`gerarTreino`, `ajustarTreino`), com uma implementação para Claude e outra para Gemini.
- A IA deve responder em **JSON estruturado** (use tool use / structured output de cada provedor), validado com Zod antes de salvar. Se vier inválido, tentar de novo uma vez e então mostrar erro amigável.
- Registrar cada geração em `geracoes_ia` (provedor, modelo, prompt enviado, resposta, tokens, data) para eu auditar e comparar Claude x Gemini.

**Contexto enviado para a IA a cada geração:**
- Meu perfil/anamnese (seção 6)
- Treino atual e os treinos anteriores
- Histórico recente de execução: cargas reais, repetições, RPE, sessões puladas
- Evolução de peso e medidas
- O pedido que eu escrever na hora

### 4. Gerar e atualizar treino com IA (na área de treino)

Na tela de treino, um botão **"Gerar novo treino com IA"** que abre:
- Campo livre para eu descrever o que quero (ex.: "quero focar mais em posterior", "só tenho 45 min por dia esta semana", "estou com dor no ombro")
- Atalhos prontos: **Novo ciclo completo**, **Ajustar treino atual**, **Progressão de cargas** (com base no que executei), **Adaptar para treino em casa**
- Escolha do provedor (Claude/Gemini) naquela geração, com padrão vindo das configurações

Fluxo:
1. IA gera a proposta
2. Mostro uma **prévia com o que mudou** em relação ao treino atual (exercícios adicionados, removidos, cargas e séries alteradas) e a justificativa da IA
3. Eu **aprovo, peço ajuste** (novo prompt em cima da proposta) ou **descarto**
4. Ao aprovar, o treino anterior é **arquivado** (nunca apagado) e o novo vira o ativo

Também quero poder editar o treino manualmente a qualquer momento (trocar exercício, séries, reps, carga, descanso, ordem).

### 5. Execução do treino

- Tela inicial com o **treino do dia** em destaque
- Execução guiada: marcar cada série, registrar carga e repetições reais, RPE (1–10)
- **Cronômetro de descanso** automático com som e vibração, que funciona com a tela em segundo plano
- Cronômetro total da sessão
- Botão **"Como executar"** por exercício: player do YouTube embutido, sem sair da tela
- Sugestão de carga com base na última execução daquele exercício
- **Offline-first:** treino salvo no aparelho; séries marcadas sem internet sincronizam ao reconectar
- Histórico de sessões e **calendário** mensal com dias treinados
- Tema claro/escuro

### 6. Meu perfil (seed inicial, editável no app)

- 39 anos, 1,80 m, peso inicial ~110 kg
- Nível intermediário, sem lesões
- Objetivo: perda de gordura + hipertrofia
- Disponibilidade: 5 a 6 dias por semana
- Estrutura atual: Push/Pull/Legs x2 (6 dias), com cardio pela manhã (caminhada inclinada)
- Treino na academia, com opção de adaptar para casa

A anamnese deve ser editável e versionada; a IA sempre recebe a versão mais recente.

### 7. Evolução

- Registro de peso e medidas (cintura, peito, braço etc.) e fotos de progresso
- Gráficos: peso ao longo do tempo, carga por exercício, volume semanal, frequência
- Streak de dias treinados

### 8. Modelo de dados inicial (proponha o schema completo com RLS)

- `perfis` / `anamneses` (versionada)
- `exercicios` (base pré-cadastrada + criados por mim; `grupo_muscular`, `equipamento`, `youtube_url`)
  - Avalie uma base pronta para importar (ex.: Free Exercise DB, wger) e me recomende, conferindo licença atual
- `treinos` (status: `ativo`, `arquivado`, `rascunho_ia`; origem: `manual`, `claude`, `gemini`)
- `treino_dias` e `treino_exercicios` (séries, reps, carga, descanso, método, ordem)
- `sessoes` e `sessao_series` (carga real, reps, RPE, horários)
- `medidas` e `fotos_progresso`
- `config_ia` (provedor e modelo padrão; chaves só em secrets/Vault)
- `geracoes_ia`

Migrations versionadas e `seed.sql` com meu perfil e um treino PPL inicial.

### 9. Fases (uma por vez, com minha aprovação entre elas)

0. **Plano:** estrutura de pastas, schema SQL com RLS, base de exercícios escolhida, desenho da Edge Function de IA e do JSON de treino. **Pare e espere minha aprovação.**
1. Setup: Next.js PWA, Supabase local, migrations, seed, tipos, `CLAUDE.md`
2. Login e perfil/anamnese
3. Treino: visualização, edição manual, execução guiada, cronômetros, offline
4. **IA:** configurações, Edge Function, Claude + Gemini, prévia com diff, aprovar/ajustar/descartar
5. Evolução: medidas, fotos, gráficos, calendário
6. Deploy na Vercel + Supabase cloud e instalação no celular

### 10. Regras de trabalho

- Ao fim de cada fase: lint, typecheck e testes, commit, e um resumo do que foi feito e de como eu testo.
- Testes mínimos: validação do JSON da IA, troca de provedor, sincronização offline e RLS.
- Mantenha `CLAUDE.md` e `.env.example` atualizados; nunca commite chaves.
- Pergunte antes de decisões difíceis de reverter.

Comece pela **Fase 0**.

## FIM DO PROMPT
