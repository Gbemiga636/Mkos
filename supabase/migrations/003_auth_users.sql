-- Auth + personalization schema for MKOS users

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  reward_points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'Nigeria',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  slug text not null,
  name text not null,
  price numeric not null,
  image text not null,
  color text not null default '',
  size text not null default '',
  quantity int not null default 1 check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, color, size)
);

create table if not exists public.user_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.user_recently_viewed (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'placed',
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'NGN',
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_postal text,
  shipping_country text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  slug text,
  name text not null,
  price numeric not null,
  image text,
  color text,
  size text,
  quantity int not null default 1
);

create index if not exists addresses_user_idx on public.addresses (user_id);
create index if not exists cart_user_idx on public.user_cart_items (user_id);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists recent_user_idx on public.user_recently_viewed (user_id, viewed_at desc);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at before update on public.addresses
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.user_cart_items enable row level security;
alter table public.user_wishlist enable row level security;
alter table public.user_recently_viewed enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','addresses','user_cart_items','user_wishlist',
        'user_recently_viewed','orders','order_items'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users manage own addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own cart" on public.user_cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own wishlist" on public.user_wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own recent" on public.user_recently_viewed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own orders" on public.orders
  for select using (auth.uid() = user_id);
create policy "Users create own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Users read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Users insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert, update, delete on public.user_cart_items to authenticated;
grant select, insert, update, delete on public.user_wishlist to authenticated;
grant select, insert, update, delete on public.user_recently_viewed to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
