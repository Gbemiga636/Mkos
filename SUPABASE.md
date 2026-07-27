# MKoS Supabase CMS

All storefront content (products, collections, section text, videos, images, FAQs, reviews, nav, newsletter) is loaded from Supabase so a future admin panel can edit everything.

## 1. Apply the schema (one-time)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/hnlhrdtsjwkythqcbmbz/sql/new)
2. Paste and run the contents of `supabase/migrations/001_cms_schema.sql`
3. Confirm tables appear under **Table Editor**

## 2. Seed current site content

```bash
npm run cms:seed
```

## 3. Environment

`.env.local` (already gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://hnlhrdtsjwkythqcbmbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Note: The anon key from chat returned `401`. Re-copy the **anon public** key from Supabase → Project Settings → API. The service role key works and is used for server-side reads/seeding only (never expose it in the browser).

## Tables (admin-ready)

| Table | Purpose |
|-------|---------|
| `site_settings` | Brand, logo, currency, shipping |
| `site_content` | Hero, campaign, editorial, footer… keyed blocks |
| `products` | Full catalog |
| `collections` / `categories` | Merchandising |
| `reviews` / `faqs` | Social proof & support |
| `navigation_links` | Header links |
| `carousel_slides` | “Move through the house” |
| `newsletter_settings` | Newsletter copy |

The storefront falls back to local data if Supabase is empty/unreachable, then switches to live CMS data after seeding.

## Media uploads (auto-compress to ~2MB)

To protect your **500MB** storage plan, every upload through `/api/media/upload` is compressed in the background:

- **Images** → WebP, quality ladder + resize until ≤ 2MB
- **Videos** → H.264 (via ffmpeg), CRF ladder until ≤ 2MB, audio stripped

1. Run `supabase/migrations/002_media_storage.sql` in the SQL Editor (creates `media` bucket + `media_assets` table)
2. Upload with:

```bash
curl -F "file=@photo.jpg" -F "folder=products" http://localhost:3000/api/media/upload
```

## Auth (accounts)

1. Run `supabase/migrations/003_auth_users.sql` in the SQL Editor
2. In Supabase → **Authentication → Providers**, ensure **Email** is enabled
3. Optional: disable “Confirm email” under Auth settings for smoother local testing

Users can sign up / sign in from the header. Cart, wishlist, addresses, and orders sync per account. `/account` is only available when signed in.
