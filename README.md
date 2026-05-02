# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

 - [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh

## Clerk + Neon

O app usa Clerk para login e, após o usuário entrar, sincroniza/consulta os dados dele em uma tabela `users` no Neon via uma API local embutida no Vite.

Crie a tabela com o arquivo `sql/neon-users.sql` e configure estas variáveis de ambiente:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
DATABASE_URL=postgresql://user:password@host/neon_db
```

Depois rode apenas o Vite:

```bash
npm run dev
```

Quando o login do Clerk estiver bem sucedido, o componente de perfil chama a API local do Vite, que faz upsert do usuário no Neon e devolve o registro salvo.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
