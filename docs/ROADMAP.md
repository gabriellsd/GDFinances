# Roadmap GDFinances

Construção incremental para manter qualidade e consistência.  
Última atualização: 17/07/2026

## Etapa 1 — Fundação ✅
- Next.js 15 + React 19 + TypeScript
- TailwindCSS + tema claro/escuro/sistema
- Componentes UI (shadcn-style)
- Layout (sidebar, header, bottom nav)
- Estrutura de pastas modular
- Schema SQL inicial + clients Supabase
- PWA manifest, SEO básico, CI

## Etapa 2 — Banco de dados ✅
- Migration completa + RLS + Storage
- Categorias e widgets criados no cadastro
- Guia: `docs/SUPABASE.md`

## Etapa 3 — Autenticação ✅
- Login / cadastro e-mail + senha
- Google OAuth (opcional, ativar no painel)
- Callback `/auth/callback`
- Logout no menu do usuário
- Middleware protege rotas quando Supabase está configurado

## Etapa 4 — Layout & UX base ⏳ (parcial)
- [x] Toasts, empty states
- [x] Modal de ação rápida (+) — criação global (conta / receita / despesa)
- [ ] Command menu (⌘K)
- [ ] Skeletons consistentes em todas as telas
- [ ] Widgets do dashboard (drag & drop)

## Etapa 5 — Core financeiro ✅ (quase completo)
- [x] Contas (CRUD + saldo atual / previsto, só contas cash)
- [x] Categorias (CRUD, ícones, cores, subcategorias, tabela estilo Mobills)
- [x] Transações (receita/despesa, fixas, parcelamentos, editar, mês no header)
- [x] Dashboard alinhado às Transações (saldo atual / previsto / receitas / despesas)
- [x] Sync de saldo: despesas de crédito pagas reduzem a conta
- [ ] Transferências entre contas (tela/fluxo dedicado)
- [ ] Metas / Assinaturas / Empréstimos / Investimentos — **fora do menu por enquanto** (rotas placeholder existem)

## Etapa 6 — Cartões ✅
- [x] Página `/cards` separada das Contas
- [x] Cadastro (limite, fechamento, vencimento, banco)
- [x] Faturas abertas / fechadas por ciclo
- [x] Valor total, status (aberta / atrasada / paga), pagar fatura
- [x] Uso de limite + disponível
- [x] Compras no crédito (`is_paid: false` = na fatura)

## Etapa 7 — Relatórios & calendário ❌
- Relatórios (placeholder)
- Calendário (placeholder)
- Gráficos avançados / comparativos
- Exportação PDF/Excel/CSV
- Perfil financeiro / score

## Etapa 8 — IA ❌
- Chat financeiro (placeholder)
- Insights automáticos
- Sugestão de categoria / OCR (fase 2)

## Etapa 9 — Polimento & deploy ⏳ (parcial)
- [x] GitHub: https://github.com/gabriellsd/GDFinances
- [x] Vercel: https://gdfinances.vercel.app
- [x] CI GitHub Actions
- [ ] Importação OFX/CSV/Excel
- [ ] Animações finais, testes, monitoramento

## Prioridade sugerida (agora)

1. Transferências entre contas  
2. Relatórios  
3. Calendário  
4. IA Financeira  
5. Command menu (⌘K) + polimento / importação / testes  

## Continuidade

Documento completo do que foi feito e do que falta:

→ **[docs/CONTINUIDADE.md](./CONTINUIDADE.md)**
