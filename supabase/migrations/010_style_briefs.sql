-- Client Style Brief submissions
create table if not exists public.style_briefs (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists style_briefs_created_idx on public.style_briefs (created_at desc);
create index if not exists style_briefs_status_idx on public.style_briefs (status);

alter table public.style_briefs enable row level security;
