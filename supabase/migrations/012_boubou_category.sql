-- Boubou under Ready-to-Wear; keep Women/Men RTW + Boubou as storefront RTW categories.
-- Safe to re-run.

insert into public.categories (slug, name, description, sort_order, is_published)
values
  ('boubou', 'Boubou', 'Effortless boubou silhouettes — refined, comfortable, and ready to style.', 2, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_published = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Ensure primary RTW categories stay published and ordered
update public.categories
set is_published = true,
    sort_order = case slug
      when 'women-rtw' then 0
      when 'men-rtw' then 1
      when 'boubou' then 2
      else sort_order
    end,
    updated_at = now()
where slug in ('women-rtw', 'men-rtw', 'boubou');

-- Assign Abeni Boubou (and similarly tagged styles) to the Boubou category
update public.products
set category_slug = 'boubou',
    collection_slug = 'ready-to-wear',
    updated_at = now()
where slug = 'abeni-boubou'
   or lower(name) like '%boubou%';
