# Roadmap GDFinances

Construção incremental para manter qualidade e consistência.

## Etapa 1 — Fundação ✅
- Next.js 15 + React 19 + TypeScript
- TailwindCSS + tema claro/escuro/sistema
- Componentes UI (shadcn-style)
- Layout (sidebar, header, bottom nav)
- Estrutura de pastas modular
- Schema SQL inicial + clients Supabase
- PWA manifest, SEO básico, CI

## Etapa 2 — Banco de dados ✅ (código pronto)
- Migration completa + RLS + Storage
- Categorias e widgets criados no cadastro
- Guia: `docs/SUPABASE.md` (você aplica no painel)

## Etapa 3 — Autenticação ✅ (código pronto)
- Login / cadastro e-mail + senha
- Google OAuth (opcional, ativar no painel)
- Callback `/auth/callback`
- Logout no menu do usuário
- Middleware protege rotas quando Supabase está configurado

## Etapa 4 — Layout & UX base
- Command menu (⌘K)
- Toasts, skeletons, empty states
- Modal de ação rápida (+)
- Widgets do dashboard (drag & drop)

## Etapa 5 — Core financeiro ✅ (parcial)
- Contas (CRUD + saldo)
- Categorias (CRUD + filtros)
- Transações receita/despesa (atualiza saldo)
- Dashboard com dados reais do Supabase
- Pendente: transferências, parcelamentos, metas, assinaturas, empréstimos, investimentos

## Etapa 6 — Cartões
- Cadastro, limite, faturas
- Compras e parcelas

## Etapa 7 — Relatórios & calendário
- Gráficos avançados
- Comparativos
- Exportação PDF/Excel/CSV
- Perfil financeiro / score

## Etapa 8 — IA
- Chat financeiro
- Insights automáticos
- Sugestão de categoria / OCR (fase 2)

## Etapa 9 — Polimento & deploy
- Animações finais
- Testes
- Vercel + GitHub Actions
- Monitoramento
