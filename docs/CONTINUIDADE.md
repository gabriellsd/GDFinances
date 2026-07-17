# GDFinances — Continuidade do projeto

**Documento para retomar o trabalho em outro PC (ex.: casa).**  
Última atualização: 17/07/2026

---

## O que é

**GDFinances** (Gabriel Dias Finances) — app de gestão financeira pessoal, Web + PWA, com Supabase e visual premium (inspirado no Mobills).

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
- [x] Documentação Supabase (`docs/SUPABASE.md`)
- [x] Menu lateral sem Metas / Investimentos / Assinaturas / Empréstimos (fora do escopo por enquanto)

### Banco (Supabase)
- [x] Schema completo (contas, transações, categorias, cartões, etc.)
- [x] RLS (cada usuário só vê os próprios dados)
- [x] Trigger no cadastro: `profiles`, `settings`, categorias padrão e widgets
- [x] Tipo `credit` + campos de cartão (`card_last_four`, limite, fechamento, vencimento)
- [x] Seeds de bancos BR e moedas
- [x] Bucket Storage `attachments`

### Autenticação
- [x] Cadastro e login com e-mail/senha
- [x] Logout no menu do usuário
- [x] Callback OAuth `/auth/callback`
- [x] Google preparado (ativar provider no Supabase se quiser)
- [x] Middleware protege rotas com env do Supabase

### Core financeiro (dados reais)
- [x] **Contas** — CRUD cash, saldo atual / previsto, logos de bancos BR
- [x] **Cartões** — página própria `/cards`, faturas abertas/fechadas, pagar fatura, limite
- [x] **Categorias** — tabela estilo Mobills (Nome / Ícone / Cor / Ações), subcategorias
- [x] **Transações** — receita/despesa, fixas, parcelas, editar, filtro de mês global no header
- [x] **Dashboard** — mesmos números de Transações (saldo atual, previsto, receitas, despesas)
- [x] Semântica de crédito: despesa no cartão nasce “na fatura”; paga → sai do em aberto e do saldo da conta
- [x] Modal global **+** (criar conta / lançamento)

### Deploy
- [x] Repo no GitHub
- [x] Produção na Vercel: https://gdfinances.vercel.app
- [x] Env vars Supabase na Vercel
- [x] CI/CD por push em `main`

---

## Atenção ao retomar (checklist rápido)

### 1) SQL do cartão de crédito (se ainda não rodou)
No Supabase → SQL Editor, rode:

`supabase/migrations/20260717120000_credit_card_fields.sql`

(e/ou a migration do tipo `credit`, se o banco for antigo)

### 2) URLs de Auth no Supabase (login na Vercel)
Authentication → URL Configuration:

- Site URL: `https://gdfinances.vercel.app` (e/ou localhost para dev)
- Redirect URLs:
  - `https://gdfinances.vercel.app/auth/callback`
  - `https://gdfinances.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

### 3) Publicar mudanças locais
```bash
git add -A
git status   # confirme que .env.local NÃO aparece
git commit -m "docs: atualiza roadmap e continuidade com status atual"
git push origin main
```

---

## O que falta continuar (prioridade sugerida)

### Próximo imediato
1. **Transferências entre contas** (tela dedicada + histórico + saldos)
2. **Relatórios** (hoje placeholder) — gráficos, comparativos, exportação
3. **Calendário** (hoje placeholder) — receitas, despesas, parcelas, faturas
4. **Command menu (⌘K)**

### Depois
5. **IA Financeira** (hoje placeholder) — chat + insights  
6. Importação OFX/CSV/Excel (+ OCR depois)  
7. Widgets arrastáveis no dashboard  
8. Skeletons / animações / testes automatizados  

### Fora do menu (adiado)
- Metas, Assinaturas, Empréstimos, Investimentos — rotas ainda existem como placeholder, mas não aparecem na navegação

Detalhes por etapa: `docs/ROADMAP.md`

---

## Menu atual (sidebar)

- Dashboard  
- Contas  
- Transações  
- Cartões de crédito  
- Categorias  
- Relatórios  
- Calendário  
- IA Financeira  
- Perfil / Configurações  

---

## Estrutura principal do código

```
src/
  app/                 # rotas (auth + app + api)
  components/          # UI, layout, providers
  features/
    accounts/          # contas cash
    credit-cards/      # cartões + faturas
    auth/
    categories/
    create/            # modais globais (+)
    dashboard/
    transactions/
  lib/
    supabase/
    banks.ts
    category-icons.tsx
    navigation.ts
  store/               # zustand (UI + mês financeiro)
supabase/
  migrations/
docs/
  SUPABASE.md
  ROADMAP.md
  CONTINUIDADE.md
```

---

## Comandos úteis

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `git push origin main` | Sobe código → Vercel redeploya |

---

## Decisões de produto já tomadas

- Nome: **GDFinances**
- UX: poucos cliques, modais, mês global no header
- Contas cash ≠ Cartões de crédito (páginas separadas)
- Despesa no crédito = fatura; pagar fatura zera o em aberto e desconta o saldo da conta
- Dashboard e Transações usam as mesmas fórmulas de saldo / receitas / despesas
- Sem Metas / Investimentos / Assinaturas / Empréstimos no menu por enquanto
- Sem `.env` no Git; secrets só em `.env.local` e Vercel

---

## Se algo quebrar

| Sintoma | O que checar |
|---------|----------------|
| `Invalid supabaseUrl` | URL no `.env.local` deve ser `https://....supabase.co` |
| Login ok no localhost, falha na Vercel | Redirect URLs no Supabase |
| Cartão / tipo crédito | Rodar migrations de `credit` + campos do cartão |
| Saldo “não bate” | Sync: despesas de crédito **pagas** reduzem a conta; pendentes só entram no previsto |
| Dashboard vazio | Criar conta → lançar transação |

---

## Resumo em uma frase

**Core no ar: Contas, Transações, Cartões/faturas, Categorias e Dashboard reais.**  
**Próximo foco: transferências → Relatórios → Calendário → IA.**
