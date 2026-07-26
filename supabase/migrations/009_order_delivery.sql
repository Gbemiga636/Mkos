-- Delivery method + expected date (fees quoted separately, not in product total)
alter table public.orders
  add column if not exists delivery_method text
    check (delivery_method is null or delivery_method in ('pickup', 'home_delivery', 'international')),
  add column if not exists expected_delivery_date date;

create index if not exists orders_delivery_method_idx
  on public.orders (delivery_method);
