# GDFinances — Continuidade do projeto

**Documento para retomar o trabalho em outro PC (ex.: casa).**  
Última atualização: 16/07/2026

---

## O que é

**GDFinances** (Gabriel Dias Finances) — app de gestão financeira pessoal, Web + PWA, com Supabase e visual premium.

---

## Links importantes

| Recurso | URL |
|--------|-----|
| GitHub | https://github.com/gabriellsd/GDFinances |
| Produção (Vercel) | https://gdfinances.vercel.app |
| Painel Vercel | https://vercel.com (projeto `gdfinances`) |
| Supabase | https://supabase.com (projeto do GDFinances) |
| Guia Supabase | `docs/SUPABASE.md` |
| Roadmap | `docs/ROADMAP.md` |

---

## Como abrir no PC de casa

```bash
git clone https://github.com/gabriellsd/GDFinances.git
cd GDFinances
npm install
cp .env.example .env.local
```

Edite `.env.local` com as chaves do Supabase (Settings → API):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://SEU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm run dev
```

Abra: http://localhost:3000

> As mesmas chaves já estão configuradas na Vercel (Production / Development).  
> **Nunca** commite o `.env.local`.

---

## Stack

- Next.js 15 + React 19 + TypeScript
- TailwindCSS 4 + componentes estilo shadcn/ui
- Framer Motion, TanStack Query, Zustand, Recharts, Zod, RHF
- Supabase (Auth + PostgreSQL + Storage + RLS)
- Deploy: Vercel + GitHub (push em `main` → deploy automático)
- CI: `.github/workflows/ci.yml`

---

## O que já foi feito

### Fundação e produto
- [x] Nome e marca **GDFinances**
- [x] Estrutura modular (`app`, `features`, `components`, `lib`, `store`, etc.)
- [x] Tema claro / escuro / sistema + paleta definida
- [x] Layout: sidebar recolhível, header, bottom nav mobile
- [x] Landing, login, register, PWA manifest, SEO básico
- [x] Documentação Supabase para iniciantes (`docs/SUPABASE.md`)
- [x] Script de reset SQL se a migration falhar (`supabase/RESET_BEFORE_INIT.sql`)

### Banco (Supabase)
- [x] Schema completo (contas, transações, categorias, cartões, metas, IA, etc.)
- [x] RLS (cada usuário só vê os próprios dados)
- [x] Trigger no cadastro: cria `profiles`, `settings`, categorias padrão e widgets
- [x] Seeds de bancos BR e moedas
- [x] Bucket Storage `attachments` (políticas prontas)
- [x] Migration aplicada no projeto Supabase (tabelas visíveis no Table Editor)

### Autenticação
- [x] Cadastro e login com e-mail/senha
- [x] Logout no menu do usuário
- [x] Callback OAuth `/auth/callback`
- [x] Botão Google preparado (precisa ativar provider no Supabase se quiser usar)
- [x] Middleware protege rotas quando as env do Supabase existem
- [x] Conta de teste criada e login funcionando (local)

### Core financeiro (dados reais)
- [x] **Contas** — CRUD, saldo, logos reais de bancos BR
- [x] Tipo de conta **Cartão / crédito** (código pronto; ver pendência SQL abaixo)
- [x] **Categorias** — listar / criar / editar / excluir + filtros
- [x] **Transações** — receita e despesa; atualiza saldo da conta
- [x] **Dashboard** — saldo total, receitas/despesas do mês, contas e últimas movimentações reais

### Deploy
- [x] Repo próprio no GitHub (não usa mais o monorepo PESSOAL)
- [x] Deploy produção na Vercel: https://gdfinances.vercel.app
- [x] Env vars Supabase na Vercel
- [x] GitHub conectado à Vercel (CI/CD por push)

---

## Atenção ao retomar (checklist rápido)

### 1) SQL do tipo crédito (se ainda não rodou)
No Supabase → SQL Editor:

```sql
alter type public.account_type add value if not exists 'credit';
```

Arquivo: `supabase/migrations/20260716160000_add_credit_account_type.sql`

### 2) URLs de Auth no Supabase (login na Vercel)
Authentication → URL Configuration:

- Site URL: `https://gdfinances.vercel.app` (e/ou localhost para dev)
- Redirect URLs:
  - `https://gdfinances.vercel.app/auth/callback`
  - `https://gdfinances.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

### 3) Commits locais ainda não enviados (PC atual)
No momento deste documento, estas mudanças podem estar **só no PC do trabalho**, não no GitHub:

- Tipo de conta `credit` + label + UI
- Migration `20260716160000_add_credit_account_type.sql`
- Ajuste do `.gitignore` (`.env.example` versionável)

**No PC de casa, depois de clonar**, confira se o tipo “Cartão / crédito” existe.  
Se não existir, faça pull de um push novo ou copie essas alterações.

Para publicar do PC que tiver as mudanças:

```bash
git add -A
git status   # confirme que .env.local NÃO aparece
git commit -m "feat: allow credit account type with bank logos support"
git push origin main
```

---

## O que falta continuar (prioridade sugerida)

### Próximo imediato
1. **Transferências entre contas** (histórico + ajuste de saldos)
2. **Módulo Cartões** de verdade (limite, fechamento, vencimento, fatura) — hoje o tipo crédito na conta é só o começo
3. **Parcelamentos** nas despesas
4. Botão **+** global (receita / despesa / transferência / investimento) em modal
5. **Command menu** (⌘K) de pesquisa global

### Depois
6. Metas + contribuições  
7. Assinaturas recorrentes  
8. Empréstimos (peguei / emprestei)  
9. Investimentos (CRUD + rentabilidade)  
10. Calendário financeiro  
11. Relatórios + exportação PDF/Excel/CSV  
12. Perfil financeiro / score  
13. Chat IA + insights automáticos  
14. Importação OFX/CSV/Excel + OCR (fase avançada)  
15. Widgets arrastáveis no dashboard  
16. Testes automatizados + polimento de UX/animações  

Detalhes por etapa: `docs/ROADMAP.md`

---

## Estrutura principal do código

```
src/
  app/                 # rotas (auth + app + api)
  components/          # UI, layout, providers
  features/
    accounts/          # contas + logos
    auth/              # login/register/logout
    categories/
    dashboard/
    transactions/
  lib/
    supabase/          # client, server, middleware
    banks.ts           # catálogo de bancos BR
    vendor/bancos-brasil/  # SVGs dos logos
  store/               # zustand (UI)
supabase/
  migrations/          # SQL do banco
  RESET_BEFORE_INIT.sql
docs/
  SUPABASE.md
  ROADMAP.md
  CONTINUIDADE.md      # este arquivo
```

---

## Comandos úteis

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `git push origin main` | Sobe código → Vercel redeploya |
| `vercel --prod` | Deploy manual (se CLI logada) |

---

## Decisões de produto já tomadas

- Nome: **GDFinances** (Gabriel Dias Finances)
- UX: poucos cliques, modais, dados reais no dashboard
- Auth: Supabase (e-mail primeiro; Google opcional)
- Contas mostram **ícones reais** dos bancos brasileiros
- Sem `.env` no Git; secrets só em `.env.local` e Vercel

---

## Se algo quebrar

| Sintoma | O que checar |
|---------|----------------|
| `Invalid supabaseUrl` | URL no `.env.local` deve ser `https://....supabase.co` (não a chave) |
| `type already exists` no SQL | Rodar `RESET_BEFORE_INIT.sql` e depois o init de novo |
| Login ok no localhost, falha na Vercel | Redirect URLs no Supabase (seção acima) |
| Não cria conta tipo crédito | Rodar o `ALTER TYPE ... 'credit'` |
| Dashboard vazio | Criar conta → lançar transação |

---

## Resumo em uma frase

**Base sólida no ar (GitHub + Vercel + Supabase + auth + contas/categorias/transações/dashboard).**  
**Próximo foco natural: transferências e cartões de crédito completos.**
