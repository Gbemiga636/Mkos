-- Paystack + guest checkout fields for orders
-- Run in Supabase SQL Editor after prior migrations

alter table public.orders
  alter column user_id drop not null;

alter table public.orders
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists paystack_reference text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists paid_at timestamptz,
  add column if not exists notes text,
  add column if not exists shipping_state text,
  add column if not exists shipping_phone text;

create unique index if not exists orders_paystack_reference_uidx
  on public.orders (paystack_reference)
  where paystack_reference is not null;

create index if not exists orders_payment_status_idx
  on public.orders (payment_status, created_at desc);

create index if not exists orders_email_idx
  on public.orders (email);

-- Clients no longer insert orders (API uses service role). Keep read access for account page.
drop policy if exists "Users create own orders" on public.orders;
drop policy if exists "Users insert own orders" on public.orders;
drop policy if exists "Users insert own order items" on public.order_items;
