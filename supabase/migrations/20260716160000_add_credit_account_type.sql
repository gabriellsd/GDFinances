-- GDFinances — adiciona tipo de conta "credit" (cartão / crédito)
-- Rode no Supabase: SQL Editor → New query → Run

alter type public.account_type add value if not exists 'credit';
