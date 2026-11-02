create table if not exists public.assistant_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'ChatGPT',
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.assistant_api_keys enable row level security;
create policy "assistant_api_keys_select_own" on public.assistant_api_keys
  for select to authenticated using (auth.uid() = user_id);
create policy "assistant_api_keys_insert_own" on public.assistant_api_keys
  for insert to authenticated with check (auth.uid() = user_id);
create policy "assistant_api_keys_update_own" on public.assistant_api_keys
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.verify_assistant_api_key(p_key_hash text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select user_id
  from public.assistant_api_keys
  where key_hash = p_key_hash
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  limit 1;
$$;
revoke all on function public.verify_assistant_api_key(text) from public;
grant execute on function public.verify_assistant_api_key(text) to anon, authenticated;
