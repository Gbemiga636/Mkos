# MKoS CMS Schema — run once in Supabase SQL Editor
-- Project: https://hnlhrdtsjwkythqcbmbz.supabase.co

create extension if not exists "pgcrypto";

-- Site-wide settings (logo, currency, brand copy)
create table if not exists public.site_settings (
  id text primary key default 'main',
  brand_name text not null default 'MKoS',
  tagline text,
  logo_url text,
  currency text not null default 'NGN',
  locale text not null default 'en-NG',
  free_shipping_threshold numeric not null default 300000,
  shipping_fee numeric not null default 28000,
  social jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Flexible CMS content keyed by section (hero, footer, etc.)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  section text not null,
  title text,
  subtitle text,
  body text,
  eyebrow text,
  cta_label text,
  cta_href text,
  media_url text,
  media_type text check (media_type is null or media_type in ('image', 'video', 'none')),
  extra jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  video_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  story text,
  price numeric not null,
  compare_at numeric,
  images jsonb not null default '[]'::jsonb,
  category_slug text references public.categories(slug) on update cascade,
  collection_slug text references public.collections(slug) on update cascade,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  material text,
  rating numeric not null default 5,
  review_count int not null default 0,
  stock int not null default 0,
  tags jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  new_arrival boolean not null default false,
  best_seller boolean not null default false,
  trending boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  location text,
  rating int not null default 5 check (rating between 1 and 5),
  body text not null,
  product_name text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.navigation_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  location text not null default 'header',
  sort_order int not null default 0,
  is_published boolean not null default true
);

create table if not exists public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  href text,
  sort_order int not null default 0,
  is_published boolean not null default true
);

create table if not exists public.newsletter_settings (
  id text primary key default 'main',
  eyebrow text,
  title text,
  subtitle text,
  button_label text,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists products_published_idx on public.products (is_published, sort_order);
create index if not exists products_flags_idx on public.products (featured, new_arrival, best_seller, trending);
create index if not exists site_content_section_idx on public.site_content (section, sort_order);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists collections_updated_at on public.collections;
create trigger collections_updated_at before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

-- RLS: public read for published content; writes via service role / admin later
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.faqs enable row level security;
alter table public.navigation_links enable row level security;
alter table public.carousel_slides enable row level security;
alter table public.newsletter_settings enable row level security;

-- Drop existing policies if re-running
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies where schemaname = 'public'
      and tablename in (
        'site_settings','site_content','categories','collections','products',
        'reviews','faqs','navigation_links','carousel_slides','newsletter_settings'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "Public read site_settings" on public.site_settings for select using (true);
create policy "Public read published site_content" on public.site_content for select using (is_published = true);
create policy "Public read published categories" on public.categories for select using (is_published = true);
create policy "Public read published collections" on public.collections for select using (is_published = true);
create policy "Public read published products" on public.products for select using (is_published = true);
create policy "Public read published reviews" on public.reviews for select using (is_published = true);
create policy "Public read published faqs" on public.faqs for select using (is_published = true);
create policy "Public read published nav" on public.navigation_links for select using (is_published = true);
create policy "Public read published carousel" on public.carousel_slides for select using (is_published = true);
create policy "Public read newsletter_settings" on public.newsletter_settings for select using (true);

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
