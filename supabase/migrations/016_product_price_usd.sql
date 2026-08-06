-- Optional USD catalogue price (NGN remains in products.price for Paystack)
alter table if exists public.products
  add column if not exists price_usd numeric;
