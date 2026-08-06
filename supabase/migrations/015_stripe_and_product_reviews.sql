-- Payment provider + customer product reviews
alter table if exists public.orders
  add column if not exists payment_provider text not null default 'paystack';

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.products(id) on delete set null,
  product_slug text,
  order_id uuid references public.orders(id) on delete set null,
  order_reference text,
  name text not null,
  email text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, is_published, created_at desc);

create index if not exists product_reviews_slug_idx
  on public.product_reviews (product_slug, is_published);
