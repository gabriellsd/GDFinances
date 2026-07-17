-- GDFinances — campos extras para cartão de crédito
-- Rode no Supabase SQL Editor se ainda não aplicou

-- Tipo credit (se ainda não rodou)
alter type public.account_type add value if not exists 'credit';

-- Últimos 4 dígitos do cartão (não armazenamos o número completo)
alter table public.credit_cards
  add column if not exists card_last_four text;

comment on column public.credit_cards.card_last_four is
  'Últimos 4 dígitos do cartão (máscara). Não armazenar PAN completo.';
