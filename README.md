# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

 - [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Neon Auth (usuario e senha)

O projeto usa uma API local no Vite para login/cadastro com persistencia na tabela `neon_auth."user"`.

### Variaveis de ambiente

Defina no arquivo `.env`:

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
AUTH_SECRET=troque-por-um-segredo-forte
```

### Estrutura SQL

O arquivo `sql/neon-users.sql` cria automaticamente:

- schema `neon_auth`
- tabela `neon_auth."user"`
- colunas `username`, `password_hash`, `password_salt`

As migrations sao aplicadas automaticamente ao subir `vite` em modo dev.

### Endpoints locais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Rodando o projeto

```bash
npm install
npm run dev
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
