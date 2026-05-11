# Ball Goes Where

Aplicacao web de bolao da Copa do Mundo 2026, com autenticacao, palpites por usuario e ranking em tempo real.

## Visao geral

O projeto tem:

- Frontend em React + Vite
- API local no modo desenvolvimento via middleware no Vite
- Funcoes serverless em producao na pasta api para deploy na Vercel
- Persistencia no Neon Postgres
- Calculo de pontuacao e leaderboard por usuario

## Funcionalidades

- Cadastro e login com token (Bearer)
- Sessao do usuario autenticado
- Salvamento de palpites por usuario
- Tabela de classificacao por grupos
- Pagina de palpites
- Ranking (leaderboard) com pontuacao
- Recalculo global do ranking

## Tecnologias

- React 19
- React Router DOM 7
- Vite 7
- Sass
- ESLint 9
- Neon Postgres
- Vercel Functions (em producao)

## Requisitos

- Node.js 20+
- npm ou yarn
- Banco Neon configurado


## Como rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Inicie em modo desenvolvimento:

```bash
npm run dev
```

3. Abra no navegador o endereco mostrado no terminal (normalmente http://localhost:5173).

Importante:

- Ao iniciar o Vite em dev, o projeto tenta aplicar automaticamente o SQL de sql/neon-users.sql (best-effort).
- Existe tambem um endpoint local de suporte para migracao: POST /api/_migrate.

## Scripts disponiveis

- npm run dev: inicia o Vite com API local
- npm run build: gera build de producao
- npm run preview: sobe preview local da build
- npm run lint: executa ESLint

## Endpoints da API

### Autenticacao

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Palpites

- GET /api/predictions/me
- PUT /api/predictions/me

### Ranking

- GET /api/ranking/leaderboard
- GET /api/ranking/scores/me
- PUT /api/ranking/scores/me
- POST /api/ranking/refresh

## Regras de pontuacao

Para cada jogo com placar oficial definido:

- Acertou resultado (vitoria, empate ou derrota): 3 pontos
- Acertou placar exato: +2 pontos
- Maximo por jogo: 5 pontos

Atualmente o totalScore e o phase02 usam a mesma regra.

## Estrutura de alto nivel

- src: frontend (paginas, componentes, hooks, contexto e servicos)
- api: funcoes serverless para producao
- sql: scripts de banco
- public: arquivos estaticos

## Deploy

O projeto foi estruturado para deploy na Vercel:

- Frontend servido pela build do Vite
- Rotas /api atendidas por funcoes em api
- Variaveis de ambiente configuradas no painel da Vercel

## Licenca

MIT (arquivo LICENSE).
