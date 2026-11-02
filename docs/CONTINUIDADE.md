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

---

# Continuidade da integração ChatGPT / MCP — 30/10/2026

> Esta seção registra o trabalho de integração do GDFinances com o ChatGPT via MCP. Ao continuar em outra máquina, leia esta seção antes de alterar código ou fazer deploy.

## Estado atual

**Integração em desenvolvimento; build passou pelas etapas de compilação, lint/tipos e geração de páginas, mas o deploy ainda precisa chegar a READY e as chamadas MCP ainda precisam ser testadas com token válido.**

- Repositório: `gabriellsd/GDFinances`
- Branch de trabalho: `feat/chatgpt-finance-api`
- Pull request: https://github.com/gabriellsd/GDFinances/pull/1
- Último commit desta etapa: `fcbed813040d4ce7756d9ff8ba04530bf2d2adf4`
- Mensagem: `fix(assistant): simplify dynamic resource query typing`
- Preview da branch: https://gdfinances-git-feat-chatgpt-finance-api-gabriellsds-projects.vercel.app
- Painel do último deployment: https://vercel.com/gabriellsds-projects/gdfinances/FN2jrvB4LW2GP1NJRjnasyQEgxJ7
- Último deployment observado: `dpl_FN2jrvB4LW2GP1NJRjnasyQEgxJ7` — estado observado durante finalização (`BUILDING`). Os logs já mostraram compilação Next.js concluída, verificação de tipos/lint sem erro e geração de 27/27 páginas; confirmar estado final na Vercel.
- Produção: https://gdfinances.vercel.app — **não foi alterada por este trabalho**.

## Regras importantes de segurança e publicação

1. Trabalhar somente na branch `feat/chatgpt-finance-api` e em Preview.
2. **Não fazer merge do PR #1 nem publicar em Production sem autorização explícita do proprietário.**
3. Nunca copiar credenciais, tokens, service-role keys ou conteúdo de `.env.local` para documentação, commits ou mensagens.
4. Os endpoints devem manter isolamento por usuário: toda consulta precisa filtrar pelo `user_id` autenticado.
5. Operações que alterem dados financeiros ainda não devem ser liberadas sem desenho de confirmação explícita, validação de autorização e testes. Não inserir/alterar transações diretamente sem entender os efeitos sobre saldos, faturas e parcelas.

## O que foi implementado na branch

### Autenticação e MCP

Arquivo: `src/app/api/assistant/mcp/route.ts`

- Endpoint MCP com suporte a `initialize`, `ping`, `tools/list` e `tools/call`.
- Encaminhamento de autenticação Bearer/API key para as rotas internas.
- Tratamento de respostas indefinidas dos handlers com resposta HTTP de erro explícita (commit `15e8dd1`).
- Ferramentas MCP publicadas no catálogo descrito abaixo.

### Resumo e lançamentos existentes

A rota MCP encaminha para handlers existentes de resumo e transações. Conferir a implementação atual antes de mudar seus contratos.

### Consulta de recursos financeiros

Arquivo: `src/app/api/assistant/resources/route.ts`

Endpoint GET para consulta read-only de recursos, com escopo por usuário, limite de 500 itens e filtros compatíveis com cada recurso.

Recursos implementados:
- `categories`
- `accounts`
- `credit_cards`
- `credit_card_bills`
- `installments` (tabela `transaction_installments`)
- `budgets`
- `goals`
- `subscriptions`
- `investments`
- `loans`
- `transfers`
- `tags`
- `credit_card_transactions`
- `goal_contributions`
- `investment_movements`

Filtros disponíveis conforme o recurso:
- `from` e `to` no formato `AAAA-MM-DD` para recursos com datas.
- `status=paid|pending` para parcelas.
- `type=income|expense` para categorias.
- `type` para movimentações de investimentos e direção de empréstimos.
- `active=true|false` para contas e assinaturas.

A consulta valida datas e retorna erro HTTP se houver falha. A query dinâmica faz cast de tabela e seleção para `string` para evitar erro de inferência excessivamente complexa do TypeScript.

### Análises financeiras

Arquivo: `src/app/api/assistant/analytics/route.ts`

Relatórios read-only implementados:
- fluxo de caixa mensal: receitas, despesas, pagas, pendentes e saldo projetado (receitas menos despesas do período; não representa necessariamente o saldo bancário inicial);
- despesas por categoria;
- despesas recorrentes;
- próximos pagamentos pendentes;
- visão de cartões e faturas;
- saúde financeira: contas ativas, investimentos, metas, empréstimos e totais do período.

A agregação monetária usa helper tipado para converter valores numéricos com segurança.

## Ferramentas MCP previstas no catálogo

**15 ferramentas de listagem:**
1. `list_financial_categories`
2. `list_financial_accounts`
3. `list_credit_cards`
4. `list_credit_card_bills`
5. `list_financial_installments`
6. `list_financial_budgets`
7. `list_financial_goals`
8. `list_financial_subscriptions`
9. `list_financial_investments`
10. `list_financial_loans`
11. `list_financial_transfers`
12. `list_financial_tags`
13. `list_credit_card_transactions`
14. `list_goal_contributions`
15. `list_investment_movements`

**6 ferramentas analíticas:**
- `get_monthly_cashflow`
- `get_spending_by_category`
- `get_recurring_expenses`
- `get_upcoming_payments`
- `get_credit_card_overview`
- `get_financial_health`

O total esperado é de 23 ferramentas contando as duas ferramentas iniciais de resumo e lançamentos. Confirmar com `tools/list` no endpoint após autenticação.

## Histórico recente de commits relevantes

| Commit | Descrição |
|---|---|
| `2f76b6d` | Endpoint de recursos financeiros read-only |
| `e6b8153` | Ferramentas MCP para recursos |
| `71ec79a` | Correção da validação de datas |
| `9f5546a` | Endpoint de análises financeiras |
| `6a5fd7d` | Ferramentas MCP de análise |
| `5b57224` | Remoção de `any` explícito nas análises |
| `ad916b3` | Remoção de binding não utilizado |
| `15e8dd1` | Tratamento de respostas indefinidas dos handlers |
| `fcbed81` | Simplificação da tipagem da query dinâmica de recursos |

## Como retomar em outra máquina

```bash
git clone https://github.com/gabriellsd/GDFinances.git
cd GDFinances
git fetch origin
git checkout feat/chatgpt-finance-api
git pull origin feat/chatgpt-finance-api
npm install
cp .env.example .env.local
```

Preencher `.env.local` com as credenciais já existentes do projeto (não incluí-las neste documento). Em seguida:

```bash
npm run dev
npm run lint
npm run build
```

Antes de começar a codificar, verificar:
```bash
git status
git log -5 --oneline
```

Não trabalhar diretamente em `main`.

## Próximos passos obrigatórios

### 1. Confirmar Preview
- [ ] Conferir se o deployment `dpl_FN2jrvB4LW2GP1NJRjnasyQEgxJ7` terminou em `READY`.
- [ ] Se falhar, abrir os eventos/logs e corrigir o erro real antes de ampliar o escopo.
- [ ] Verificar que o alias Preview aponta para o deployment correto.
- [ ] Production permanece intocada.

### 2. Testar protocolo MCP
- [ ] Fazer chamada sem token e confirmar resposta 401 / metadados OAuth esperados.
- [ ] Obter token OAuth válido pelo fluxo configurado; nunca registrar token em log/documentação.
- [ ] Testar `initialize`, `ping`, `tools/list`.
- [ ] Testar `tools/call` para resumo, lançamentos, ao menos um recurso e cada tipo de análise.
- [ ] Confirmar isolamento: usuário autenticado só recebe seus próprios dados.
- [ ] Confirmar filtros de data/status e respostas de erro.

### 3. Conferir qualidade dos dados
- [ ] Comparar os totais de fluxo de caixa com os valores exibidos no app.
- [ ] Verificar faturas, parcelas e contas pendentes com dados reais de teste.
- [ ] Revisar se nomes de campos e tabelas usados nas consultas correspondem ao schema atual.
- [ ] Avaliar paginação/limite de 500 itens para relatórios maiores.

### 4. Depois dos testes read-only
- [ ] Melhorar análises (tendências mensais, orçamento x realizado, estabelecimentos/descrições, renovação de assinaturas, dívidas).
- [ ] Inspecionar os fluxos atuais de criação/edição/pagamento no frontend antes de criar mutações via MCP.
- [ ] Implementar alterações financeiras somente com prévia + confirmação explícita e proteção contra repetição.
- [ ] Atualizar esta documentação a cada etapa validada.

## Diagnóstico de erros já encontrados

- Build antigo falhava por `any` explícito em analytics e variável não utilizada no MCP; foram corrigidos.
- Build seguinte falhava porque handlers poderiam retornar `undefined`; corrigido com fallback `NextResponse.json(..., { status: 500 })`.
- Build do commit `15e8dd1` revelou erro de tipo no Supabase: “Expression produces a union type that is too complex to represent” em `resources/route.ts:37`.
- No commit `fcbed81`, a query foi ajustada para `from(config.table as string).select(config.select as string)`. Os logs do deployment seguinte passaram da compilação e da checagem de tipos, geraram 27/27 páginas e entraram em finalização. **Ainda confirmar READY e executar testes de integração.**
- Um aviso não fatal de dependência ausente em `useEffect` existe em `src/features/create/components/transaction-create-dialog.tsx` (linha aproximada 251).

## Observação sobre configuração Vercel

Durante a configuração, a proteção SSO do Preview foi contornada apenas para o alias Preview. Isso não desativa a autenticação Bearer/OAuth da API. Não alterar proteção ou configurações de Production sem necessidade e autorização.


## Guia de conexão do plugin ChatGPT

Foi criado `docs/GUIA_PLUGIN_CHATGPT.md`, com arquitetura, endpoint MCP, ferramentas, autenticação realmente encontrada no código, passos de conexão no ChatGPT para quando OAuth estiver pronto, testes e checklist de pendências.

**Importante:** o servidor MCP e as ferramentas read-only estão implementados, mas a autenticação OAuth 2.1 compatível com MCP/ChatGPT ainda precisa ser implementada ou comprovada de ponta a ponta. A rota de metadados atual, isoladamente, não comprova esse fluxo. Não considerar o plugin pronto nem configurar acesso sem autenticação para dados financeiros reais.
