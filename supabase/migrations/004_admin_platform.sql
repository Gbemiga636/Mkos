-- MKOS Admin Platform + Analytics
-- Run in Supabase SQL Editor after 001–003

create extension if not exists "pgcrypto";

-- ─── Admin accounts ───────────────────────────────────────────
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  password_set_at timestamptz,
  full_name text default 'MKOS Administrator',
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  must_set_password boolean not null default true,
  failed_logins int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_accounts (email, must_set_password, full_name, role)
values ('mkosfashionhouse@gmail.com', true, 'MKOS House', 'owner')
on conflict (email) do nothing;

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_accounts(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists admin_sessions_token_idx on public.admin_sessions(token_hash);
create index if not exists admin_sessions_admin_idx on public.admin_sessions(admin_id);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_accounts(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  kind text not null default 'system',
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Analytics ────────────────────────────────────────────────
create table if not exists public.analytics_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  country text,
  city text,
  device text,
  browser text,
  os text,
  is_returning boolean not null default false
);

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  landed_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text,
  browser text,
  os text,
  country text,
  city text,
  page_count int not null default 0,
  bounce boolean not null default true,
  duration_ms int not null default 0
);

create index if not exists analytics_sessions_visitor_idx on public.analytics_sessions(visitor_id);
create index if not exists analytics_sessions_started_idx on public.analytics_sessions(started_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  visitor_id text not null,
  session_id text not null,
  event_type text not null,
  path text,
  label text,
  product_id text,
  product_slug text,
  value numeric,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_type_idx on public.analytics_events(event_type, occurred_at desc);
create index if not exists analytics_events_path_idx on public.analytics_events(path, occurred_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events(session_id);

create table if not exists public.analytics_live (
  session_id text primary key,
  visitor_id text not null,
  path text,
  last_seen_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

-- ─── Pages / Blog / Media extras ──────────────────────────────
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled', 'archived')),
  meta_title text,
  meta_description text,
  og_image text,
  canonical_url text,
  sections jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_image text,
  author_name text default 'MKOS',
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  reading_time int default 3,
  meta_title text,
  meta_description text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- media_assets already created in 002_media_storage.sql
alter table public.media_assets add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.media_assets add column if not exists folder text default 'general';
alter table public.media_assets add column if not exists filename text;

-- RLS: service role bypasses; lock down public access
alter table public.admin_accounts enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.analytics_visitors enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_live enable row level security;
alter table public.site_pages enable row level security;
alter table public.blog_posts enable row level security;

-- Analytics ingest allowed via service role from API only (no public policies)

insert into public.admin_notifications (title, body, kind)
select * from (values
  ('Welcome to MKOS Admin', 'Your control center is ready. Set your password to secure the house.', 'system'),
  ('CMS connected', 'Products, content, and media sync with the live storefront.', 'system')
) as v(title, body, kind)
where not exists (select 1 from public.admin_notifications limit 1);
