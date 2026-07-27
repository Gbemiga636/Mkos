-- MKoS Experience inquiries (content consent + Full Glam bookings)
create table if not exists public.experience_inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('content', 'full_glam')),
  full_name text not null,
  email text not null,
  phone text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_inquiries_kind_idx on public.experience_inquiries (kind);
create index if not exists experience_inquiries_created_idx on public.experience_inquiries (created_at desc);
create index if not exists experience_inquiries_status_idx on public.experience_inquiries (status);

alter table public.experience_inquiries enable row level security;
-- Service role only (API); no public policies
