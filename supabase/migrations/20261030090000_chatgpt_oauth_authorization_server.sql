-- GDFinances — OAuth 2.1 Authorization Server para integração MCP
-- Aplicar somente em ambiente Preview/staging após revisão.
-- Esta migration NÃO deve ser executada diretamente em Production.
--
-- As tabelas são acessadas exclusivamente pelo backend usando SUPABASE_SERVICE_ROLE_KEY.
-- Não criar policies para anon/authenticated: RLS + revogação explícita de privilégios.

create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text not null,
  client_uri text,
  logo_uri text,
  redirect_uris text[] not null,
  grant_types text[] not null default array['authorization_code', 'refresh_token']::text[],
  response_types text[] not null default array['code']::text[],
  token_endpoint_auth_method text not null default 'none'
    check (token_endpoint_auth_method in ('none')),
  scope text not null default 'finance:read',
  client_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  disabled_at timestamptz,
  constraint oauth_clients_redirect_uris_nonempty check (cardinality(redirect_uris) > 0)
);

create table if not exists public.oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null references public.oauth_clients(client_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redirect_uri text not null,
  scope text not null,
  code_challenge text not null,
  code_challenge_method text not null check (code_challenge_method = 'S256'),
  resource text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_authorization_codes_expiry_idx
  on public.oauth_authorization_codes (expires_at);

create table if not exists public.oauth_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.oauth_clients(client_id) on delete cascade,
  scopes text[] not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, client_id)
);

create table if not exists public.oauth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  family_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.oauth_clients(client_id) on delete cascade,
  scope text not null,
  resource text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  replaced_by_hash text,
  created_at timestamptz not null default now()
);

create index if not exists oauth_refresh_tokens_family_idx
  on public.oauth_refresh_tokens (family_id);
create index if not exists oauth_refresh_tokens_user_client_idx
  on public.oauth_refresh_tokens (user_id, client_id);
create index if not exists oauth_refresh_tokens_expiry_idx
  on public.oauth_refresh_tokens (expires_at);

alter table public.oauth_clients enable row level security;
alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_consents enable row level security;
alter table public.oauth_refresh_tokens enable row level security;

revoke all on table public.oauth_clients from anon, authenticated;
revoke all on table public.oauth_authorization_codes from anon, authenticated;
revoke all on table public.oauth_consents from anon, authenticated;
revoke all on table public.oauth_refresh_tokens from anon, authenticated;

grant all on table public.oauth_clients to service_role;
grant all on table public.oauth_authorization_codes to service_role;
grant all on table public.oauth_consents to service_role;
grant all on table public.oauth_refresh_tokens to service_role;

comment on table public.oauth_clients is
  'OAuth public clients autorizados a usar o GDFinances MCP. Backend/service role only.';
comment on table public.oauth_authorization_codes is
  'Authorization codes de uso único, armazenados somente como SHA-256.';
comment on table public.oauth_consents is
  'Consentimentos explícitos por usuário, cliente e escopos concedidos.';
comment on table public.oauth_refresh_tokens is
  'Refresh tokens rotativos, armazenados somente como SHA-256; reutilização revoga a família.';
