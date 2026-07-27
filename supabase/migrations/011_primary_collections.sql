-- Primary offerings: Ready-to-Wear, Bespoke, Bridal (+ sub-categories)
-- Safe to re-run. Does not delete legacy women/men rows.

insert into public.collections (slug, name, description, image_url, sort_order, is_published)
values
  ('ready-to-wear', 'Ready-to-Wear', 'Timeless Ready-to-Wear for women and men — refined, versatile, ready now.', '/images/products/abeni-boubou.jpg', 0, true),
  ('bespoke', 'Bespoke', 'Expertly crafted Custom/Bespoke — women’s and men’s bespoke, Aso Ebi, and occasion wear.', '/images/products/jagu-jacket.jpg', 1, true),
  ('bridal', 'Bridal', 'Luxurious Bridal designs — registry gowns, reception dresses, bridesmaids, grooms, and family.', '/images/products/tammy-dress.jpg', 2, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = coalesce(nullif(collections.image_url, ''), excluded.image_url),
  is_published = true,
  updated_at = now();

insert into public.categories (slug, name, description, sort_order, is_published)
values
  ('women-rtw', 'Women’s RTW', 'Ready-to-wear for women — everyday elegance and occasion silhouettes.', 0, true),
  ('men-rtw', 'Men’s RTW', 'Contemporary menswear blending modern utility with African heritage.', 1, true),
  ('women-bespoke', 'Women’s Bespoke', 'Made-to-measure and couture crafted for her individuality.', 2, true),
  ('men-bespoke', 'Men’s Bespoke', 'Bespoke menswear tailored with precision and cultural authenticity.', 3, true),
  ('aso-ebi', 'Aso Ebi', 'Coordinated ensembles for celebrations and family occasions.', 4, true),
  ('occasion', 'Occasion Wear', 'Refined looks for celebrations, dinners, and standout moments.', 5, true),
  ('registry-gowns', 'Registry Gowns', 'Bridal registry looks crafted for the ceremony.', 6, true),
  ('reception', 'Reception Dresses', 'Reception silhouettes for the celebration after the vows.', 7, true),
  ('bridesmaids', 'Bridesmaids', 'Coordinated elegance for the bridal party.', 8, true),
  ('grooms', 'Grooms', 'Refined looks for the groom and groomsmen.', 9, true),
  ('bridal-party', 'Family & Bridal Party', 'Thoughtfully crafted pieces for family and wedding guests.', 10, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_published = true,
  updated_at = now();

-- Remap products from legacy women/men collection framing
update public.products
set collection_slug = 'ready-to-wear',
    category_slug = case
      when collection_slug = 'men' or category_slug = 'men' then 'men-rtw'
      when category_slug in ('ready-to-wear', 'women') or collection_slug = 'women' then 'women-rtw'
      else category_slug
    end,
    updated_at = now()
where collection_slug in ('women', 'men')
   or category_slug in ('ready-to-wear', 'men');

update public.products
set collection_slug = 'bespoke',
    category_slug = coalesce(nullif(category_slug, 'custom'), 'women-bespoke'),
    updated_at = now()
where category_slug = 'custom';

-- Prefer primary collections on the storefront (hide legacy gender collections)
update public.collections
set is_published = false, updated_at = now()
where slug in ('women', 'men');

-- Hide legacy category rows that collide with the new taxonomy after remap
update public.categories
set is_published = false, updated_at = now()
where slug in ('ready-to-wear', 'women', 'men', 'custom', 'bridal');
