-- Focal point for collection cover crops (CSS object-position, 0–100%).
alter table public.collections
  add column if not exists image_focus jsonb not null default '{"x":50,"y":50}'::jsonb;

comment on column public.collections.image_focus is
  'Focal point {x,y} percent for object-position on collection covers';

-- Sensible default for bridal couple portrait (keep heads in frame)
update public.collections
set image_focus = '{"x":50,"y":28}'::jsonb
where slug = 'bridal'
  and (image_focus is null or image_focus = '{"x":50,"y":50}'::jsonb);
