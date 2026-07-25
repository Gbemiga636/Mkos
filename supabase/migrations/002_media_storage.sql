-- Media library + storage helpers for compressed uploads
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  public_url text not null,
  kind text not null check (kind in ('image', 'video')),
  mime_type text,
  original_bytes bigint,
  compressed_bytes bigint,
  width int,
  height int,
  alt text,
  created_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;

drop policy if exists "Public read media_assets" on public.media_assets;
create policy "Public read media_assets" on public.media_assets for select using (true);

grant select on public.media_assets to anon, authenticated;
grant all on public.media_assets to service_role;

-- Create public storage bucket for CMS media (run in SQL Editor)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read media bucket" on storage.objects;
create policy "Public read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Service role manage media bucket" on storage.objects;
create policy "Service role manage media bucket"
  on storage.objects for all
  using (bucket_id = 'media')
  with check (bucket_id = 'media');
