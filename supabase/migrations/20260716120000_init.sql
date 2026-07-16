-- GDFinances — schema inicial
-- Etapa 2 do roadmap: aplicar no Supabase (SQL Editor ou CLI)
--
-- Se aparecer erro "type ... already exists" ou "relation already exists":
-- 1) Rode antes: supabase/RESET_BEFORE_INIT.sql
-- 2) Depois rode este arquivo de novo

create extension if not exists "pgcrypto";

do $$ begin
  create type public.account_type as enum (
    'checking',
    'savings',
    'wallet',
    'cash',
    'credit',
    'investment',
    'international'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transaction_type as enum (
    'income',
    'expense',
    'transfer'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum (
    'pix',
    'debit',
    'credit',
    'cash',
    'boleto',
    'ted',
    'doc'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_plan as enum ('free', 'premium');
exception when duplicate_object then null;
end $$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan public.app_plan not null default 'free',
  role public.app_role not null default 'user',
  locale text not null default 'pt-BR',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_id uuid references public.banks(id),
  name text not null,
  bank_name text,
  type public.account_type not null default 'checking',
  color text not null default '#4F46E5',
  icon text,
  currency text not null default 'BRL',
  initial_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text not null default '#6B7280',
  monthly_limit numeric(14,2),
  created_at timestamptz not null default now()
);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  bank_name text,
  brand text,
  color text not null default '#4F46E5',
  credit_limit numeric(14,2) not null default 0,
  available_limit numeric(14,2) not null default 0,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  best_day int check (best_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table public.credit_card_bills (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_month date not null,
  closing_date date not null,
  due_date date not null,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id),
  to_account_id uuid not null references public.accounts(id),
  amount numeric(14,2) not null,
  date date not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  category_id uuid references public.categories(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  transfer_id uuid references public.transfers(id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14,2) not null,
  description text,
  notes text,
  date date not null,
  payment_method public.payment_method,
  is_paid boolean not null default true,
  is_recurring boolean not null default false,
  installment_count int,
  installment_current int,
  cost_center text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_installments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_number int not null,
  amount numeric(14,2) not null,
  due_date date not null,
  is_paid boolean not null default false,
  paid_at timestamptz
);

create table public.credit_card_transactions (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.credit_card_bills(id) on delete set null,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  description text,
  purchase_date date not null,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  month date not null,
  amount numeric(14,2) not null,
  spent numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  target_date date,
  icon text,
  color text not null default '#22C55E',
  created_at timestamptz not null default now()
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  amount numeric(14,2) not null default 0,
  profitability numeric(8,4),
  institution text,
  created_at timestamptz not null default now()
);

create table public.investment_movements (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('buy', 'sell', 'dividend', 'yield')),
  amount numeric(14,2) not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(14,2) not null,
  billing_day int not null check (billing_day between 1 and 31),
  renewal_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  counterparty text not null,
  direction text not null check (direction in ('borrowed', 'lent')),
  principal numeric(14,2) not null,
  interest_rate numeric(8,4) default 0,
  installment_count int,
  balance numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6B7280',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'system',
  language text not null default 'pt-BR',
  currency text not null default 'BRL',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.currencies (
  code text primary key,
  name text not null,
  symbol text not null
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null references public.currencies(code),
  quote_currency text not null references public.currencies(code),
  rate numeric(18,8) not null,
  as_of date not null,
  unique (base_currency, quote_currency, as_of)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  widget_key text not null,
  position int not null default 0,
  visible boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique (user_id, widget_key)
);

create index accounts_user_id_idx on public.accounts(user_id);
create index transactions_user_date_idx on public.transactions(user_id, date desc);
create index categories_user_id_idx on public.categories(user_id);
create index credit_cards_user_id_idx on public.credit_cards(user_id);
create index goals_user_id_idx on public.goals(user_id);
create index notifications_user_id_idx on public.notifications(user_id, is_read);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.credit_card_bills enable row level security;
alter table public.credit_card_transactions enable row level security;
alter table public.transaction_installments enable row level security;
alter table public.transfers enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.investments enable row level security;
alter table public.investment_movements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.loans enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.tags enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.settings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.dashboard_widgets enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.settings (user_id) values (new.id);

  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Salário', 'income', 'wallet', '#22C55E'),
    (new.id, 'Freelance', 'income', 'briefcase', '#06B6D4'),
    (new.id, 'Investimentos', 'income', 'trending-up', '#4F46E5'),
    (new.id, 'Outras receitas', 'income', 'plus-circle', '#8B5CF6'),
    (new.id, 'Moradia', 'expense', 'home', '#EF4444'),
    (new.id, 'Mercado', 'expense', 'shopping-cart', '#F59E0B'),
    (new.id, 'Transporte', 'expense', 'car', '#3B82F6'),
    (new.id, 'Saúde', 'expense', 'heart', '#EC4899'),
    (new.id, 'Lazer', 'expense', 'smile', '#14B8A6'),
    (new.id, 'Assinaturas', 'expense', 'repeat', '#6366F1'),
    (new.id, 'Educação', 'expense', 'book', '#0EA5E9'),
    (new.id, 'Outras despesas', 'expense', 'more-horizontal', '#6B7280');

  insert into public.dashboard_widgets (user_id, widget_key, position, visible) values
    (new.id, 'balance', 0, true),
    (new.id, 'income', 1, true),
    (new.id, 'expense', 2, true),
    (new.id, 'savings', 3, true),
    (new.id, 'evolution_chart', 4, true),
    (new.id, 'ai_insights', 5, true),
    (new.id, 'recent_transactions', 6, true),
    (new.id, 'goals', 7, true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

create policy "accounts_all_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_all_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_all_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_cards_all_own" on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_card_bills_all_own" on public.credit_card_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_card_transactions_all_own" on public.credit_card_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transaction_installments_all_own" on public.transaction_installments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal_contributions_all_own" on public.goal_contributions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "investments_all_own" on public.investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "investment_movements_all_own" on public.investment_movements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_all_own" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "loans_all_own" on public.loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_all_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_all_own" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_conversations_all_own" on public.ai_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_messages_all_own" on public.ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dashboard_widgets_all_own" on public.dashboard_widgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_all_own" on public.tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transfers_all_own" on public.transfers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_all_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attachments_all_own" on public.attachments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transaction_tags_all_own" on public.transaction_tags for all
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_id and t.user_id = auth.uid()
  )
);

alter table public.banks enable row level security;
create policy "banks_select_authenticated" on public.banks
  for select to authenticated using (true);

insert into public.currencies (code, name, symbol) values
  ('BRL', 'Real Brasileiro', 'R$'),
  ('USD', 'Dólar Americano', '$'),
  ('EUR', 'Euro', '€')
on conflict do nothing;

insert into public.banks (name, code) values
  ('Nubank', '260'),
  ('Inter', '077'),
  ('Itaú', '341'),
  ('Bradesco', '237'),
  ('Banco do Brasil', '001'),
  ('Santander', '033'),
  ('C6 Bank', '336'),
  ('XP', '348'),
  ('BTG Pactual', '208'),
  ('Caixa', '104');

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_storage_select_own" on storage.objects;
drop policy if exists "attachments_storage_insert_own" on storage.objects;
drop policy if exists "attachments_storage_update_own" on storage.objects;
drop policy if exists "attachments_storage_delete_own" on storage.objects;

create policy "attachments_storage_select_own"
on storage.objects for select to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_storage_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_storage_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_storage_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
