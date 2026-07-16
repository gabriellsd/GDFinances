# GDFinances

**Gabriel Dias Finances** — gestão financeira pessoal moderna, premium e com IA. Web + PWA.

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, TanStack Query, Zustand, Recharts
- **UI:** componentes no padrão shadcn/ui + Lucide
- **Backend:** App Router (API Routes / Server Actions)
- **Dados:** Supabase (Auth, PostgreSQL, Storage, Realtime)

## Começar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Sem credenciais Supabase, o app roda em **modo preview** (dashboard com dados mock e rotas protegidas liberadas).

## Estrutura

```
src/
  app/           # rotas (auth + app)
  components/    # UI + layout + providers
  features/      # módulos de domínio
  hooks/
  lib/           # supabase, constants, navigation
  services/
  store/         # zustand
  types/
  utils/
supabase/
  migrations/    # schema PostgreSQL + RLS
docs/
```

## Banco de dados e autenticação

Siga o guia passo a passo (feito para quem nunca usou Supabase):

**[docs/SUPABASE.md](docs/SUPABASE.md)**

Resumo:
1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar URL + anon key para `.env.local`
3. Rodar o SQL em `supabase/migrations/20260716120000_init.sql`
4. Configurar Site URL / Redirect URLs
5. Criar conta em `/register`

Sem as chaves no `.env.local`, o app continua em **modo preview**.

## Roadmap

Veja [docs/ROADMAP.md](docs/ROADMAP.md). Próximo: Contas, Categorias e Transações.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |

## Design

- Light: fundo `#F7F8FA`, cards `#FFFFFF`, primary `#4F46E5`
- Dark: fundo `#0F1115`, cards `#181A20`, primary `#7C6CFF`
- Tipografia: Inter (400–700)
- Tema: claro / escuro / sistema
