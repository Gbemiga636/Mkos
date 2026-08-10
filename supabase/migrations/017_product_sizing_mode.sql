-- Size vs length fitting mode for products
alter table if exists public.products
  add column if not exists sizing_mode text not null default 'size';

alter table if exists public.products
  add column if not exists sizing_note text;

alter table if exists public.order_items
  add column if not exists sizing_mode text;

comment on column public.products.sizing_mode is 'size = letter sizes; length = one-size note + length options';
comment on column public.products.sizing_note is 'Shown above length options (default: One size fits all)';
