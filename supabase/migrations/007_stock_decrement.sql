-- Atomic stock decrement on paid orders (auto sold-out when qty hits 0)
create or replace function public.decrement_product_stock(p_id text, p_qty int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stock int;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'quantity must be positive';
  end if;

  update public.products
  set
    stock = greatest(0, coalesce(stock, 0) - p_qty),
    updated_at = now()
  where id = p_id
  returning stock into new_stock;

  if not found then
    return null;
  end if;

  return new_stock;
end;
$$;

grant execute on function public.decrement_product_stock(text, int) to service_role;
