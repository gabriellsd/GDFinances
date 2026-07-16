-- =============================================================================
-- GDFinances — RESET (rode ISTO primeiro se o init falhou no meio)
-- =============================================================================
-- O que faz: apaga tabelas/tipos do schema public que o GDFinances cria.
-- NÃO apaga usuários do Auth (login). Só limpa o banco de dados das tabelas.
--
-- Como usar no Supabase:
-- 1) SQL Editor → New query
-- 2) Cole este arquivo inteiro → Run
-- 3) Depois rode de novo: 20260716120000_init.sql
-- =============================================================================

-- Remove políticas de Storage (anexos), se existirem
-- Obs: NÃO usamos DELETE em storage.buckets — o Supabase bloqueia isso.
-- Se o bucket "attachments" já existir, o init ignora (ON CONFLICT DO NOTHING).
drop policy if exists "attachments_storage_select_own" on storage.objects;
drop policy if exists "attachments_storage_insert_own" on storage.objects;
drop policy if exists "attachments_storage_update_own" on storage.objects;
drop policy if exists "attachments_storage_delete_own" on storage.objects;

-- Trigger de novo usuário
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Tabelas (ordem importa por causa das foreign keys)
drop table if exists public.transaction_tags cascade;
drop table if exists public.ai_messages cascade;
drop table if exists public.ai_conversations cascade;
drop table if exists public.dashboard_widgets cascade;
drop table if exists public.exchange_rates cascade;
drop table if exists public.currencies cascade;
drop table if exists public.settings cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.tags cascade;
drop table if exists public.notifications cascade;
drop table if exists public.attachments cascade;
drop table if exists public.loans cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.investment_movements cascade;
drop table if exists public.investments cascade;
drop table if exists public.goal_contributions cascade;
drop table if exists public.goals cascade;
drop table if exists public.budgets cascade;
drop table if exists public.credit_card_transactions cascade;
drop table if exists public.transaction_installments cascade;
drop table if exists public.transactions cascade;
drop table if exists public.transfers cascade;
drop table if exists public.credit_card_bills cascade;
drop table if exists public.credit_cards cascade;
drop table if exists public.categories cascade;
drop table if exists public.accounts cascade;
drop table if exists public.banks cascade;
drop table if exists public.profiles cascade;

-- Tipos (enums) — eram a causa do erro "already exists"
drop type if exists public.payment_method cascade;
drop type if exists public.transaction_type cascade;
drop type if exists public.account_type cascade;
drop type if exists public.app_role cascade;
drop type if exists public.app_plan cascade;

-- Mensagem de confirmação (aparece no resultado do SQL Editor)
select 'Reset concluído. Agora rode o arquivo 20260716120000_init.sql' as status;
