/**
 * Seeds Supabase with MKoS CMS content — SAFE BY DEFAULT.
 *
 * Default behaviour (preserves admin / live edits):
 * - Never deletes existing rows
 * - Never overwrites existing site_content, navigation, carousel, reviews, faqs, newsletter
 * - Only inserts missing products / categories / collections (by id or slug)
 * - Only fills site_settings / content blocks when missing
 *
 * Destructive full reset (explicit only):
 *   npx tsx scripts/seed-cms.ts --force
 *
 * Sync product catalog fields from code without deleting extras:
 *   npx tsx scripts/seed-cms.ts --sync-products
 *
 * Prerequisites: run supabase/migrations/001_cms_schema.sql first.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  products,
  categories,
  collections,
  reviews,
  faqs,
} from "../src/data/products";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const FORCE = process.argv.includes("--force");
const SYNC_PRODUCTS = process.argv.includes("--sync-products") || FORCE;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsert(table: string, rows: Record<string, unknown>[], onConflict?: string) {
  if (!rows.length) return;
  const q = supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  const { error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table} upsert (${rows.length})`);
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

async function existingKeys(table: string, column: string): Promise<Set<string>> {
  const { data, error } = await supabase.from(table).select(column);
  if (error) throw new Error(`${table} select: ${error.message}`);
  return new Set((data ?? []).map((row) => String((row as Record<string, unknown>)[column])));
}

const contentBlocks = [
  {
    key: "hero",
    section: "hero",
    eyebrow: "My Kind of Style",
    title: "For Those Who\nUnderstand STYLE.",
    subtitle:
      "Nigerian contemporary fashion — timeless styles that blend modern design with African heritage.",
    cta_label: "Our services",
    cta_href: "/#services",
    media_url: "/videos/hero-bg.mp4",
    media_type: "video",
    extra: { secondary_cta_label: "Our story", secondary_cta_href: "/about" },
    sort_order: 0,
  },
  {
    key: "campaign",
    section: "campaign",
    eyebrow: "Craft & Culture",
    title: "Style should be personal.",
    subtitle: "",
    cta_label: "Shop Ready-to-Wear",
    cta_href: "/shop?collection=ready-to-wear",
    media_url: "/videos/cloth-1.mp4",
    media_type: "video",
    sort_order: 1,
  },
  {
    key: "editorial",
    section: "editorial",
    eyebrow: "Our Philosophy",
    media_url: "/images/brand/mkos-signature.jpg",
    media_type: "image",
    extra: {
      lines: [
        "Timeless by design.",
        "MKoS fashion moves with time,",
        "revisiting trends with intention.",
      ],
    },
    sort_order: 2,
  },
  {
    key: "featured_collections",
    section: "featured_collections",
    eyebrow: "Collections",
    title: "Designed for Every Defining Moment.",
    subtitle:
      "Ready-to-Wear. Bespoke. Bridal — three ways to experience MKoS: discover timeless Ready-to-Wear, expertly crafted Bespoke creations, and luxurious Bridal designs, each thoughtfully made for those who understand style.",
    sort_order: 3,
  },
  {
    key: "featured_video",
    section: "featured_video",
    title: "MKoS in motion",
    media_url: "/videos/mkos-in-motion.mp4",
    media_type: "video",
    sort_order: 4,
  },
  {
    key: "new_arrivals",
    section: "new_arrivals",
    eyebrow: "New",
    title: "Just arrived.",
    subtitle:
      "The latest ready to wear collections crafted with care and precision for both men and women.",
    sort_order: 5,
  },
  {
    key: "categories",
    section: "categories",
    eyebrow: "Shop by",
    title: "Find your lane.",
    subtitle: "Women’s style, Men’s style, and Boubou — within the collections.",
    sort_order: 6,
  },
  {
    key: "trending",
    section: "trending",
    eyebrow: "Trending",
    title: "What everyone’s reaching for.",
    sort_order: 7,
  },
  {
    key: "best_sellers",
    section: "best_sellers",
    eyebrow: "Best sellers",
    title: "Styles that stay with you.",
    sort_order: 8,
  },
  {
    key: "carousel",
    section: "carousel",
    eyebrow: "Lookbook",
    title: "In the house.",
    sort_order: 9,
  },
  {
    key: "instagram",
    section: "instagram",
    eyebrow: "Social",
    title: "On Instagram.",
    cta_href: "https://www.instagram.com/shopmykindofstyle",
    extra: { gallery: [] as string[] },
    sort_order: 10,
  },
  {
    key: "reviews",
    section: "reviews",
    eyebrow: "Love notes",
    title: "From the MKoS feed.",
    sort_order: 11,
  },
  {
    key: "faq",
    section: "faq",
    eyebrow: "FAQ",
    title: "Questions, answered.",
    sort_order: 12,
  },
  {
    key: "marquee",
    section: "marquee",
    body: "MKoS · MY KIND OF STYLE · READY-TO-WEAR · BESPOKE · BRIDAL · ",
    sort_order: 13,
  },
  {
    key: "shop",
    section: "shop",
    eyebrow: "Shop",
    title: "The MKoS collections.",
    subtitle: "Women’s style, Men’s style, and Boubou. Pricing managed via admin.",
    sort_order: 14,
  },
  {
    key: "brand_story",
    section: "brand_story",
    eyebrow: "About MKoS",
    title: "My Kind of Style.",
    body: "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.",
    cta_label: "Explore the shop",
    cta_href: "/shop",
    media_url: "/images/products/abeni-boubou.jpg",
    media_type: "image",
    sort_order: 15,
  },
  {
    key: "footer",
    section: "footer",
    sort_order: 16,
  },
  {
    key: "experience_video",
    section: "experience_video",
    eyebrow: "Studio · Oniru",
    title: "Experience with you",
    subtitle: "Step inside the house.",
    body: "Luxury is more than what you wear-it's how you feel.",
    cta_label: "Explore",
    cta_href: "/experience",
    media_url: "/videos/experience-1.mp4",
    media_type: "video",
    sort_order: 17,
  },
  {
    key: "bespoke_video",
    section: "bespoke_video",
    eyebrow: "Bespoke / Custom Wear",
    title: "Made for your moment — not the rack",
    subtitle: "Made for your moment.",
    body: "Begin your atelier brief. Share the occasion, the silhouette, and the services you want. The house crafts from there.",
    cta_label: "Explore",
    cta_href: "/bespoke",
    media_url: "/videos/bespoke-1.mp4",
    media_type: "video",
    sort_order: 18,
  },
  {
    key: "bridal_video",
    section: "bridal_video",
    eyebrow: "Client Bridal Brief",
    title: "Begin your MKoS Bridal experience",
    subtitle: "Made for your vows.",
    body: "Thank you for choosing MKoS. Complete this bridal brief so our atelier can understand your wedding vision, styling needs, and celebration details — then craft a look made exclusively for you.",
    cta_label: "Begin",
    cta_href: "/bridal",
    media_url: "/videos/bridal-hero.mp4",
    media_type: "video",
    sort_order: 19,
  },
];

const defaultNav = [
  { label: "Home", href: "/", location: "header", sort_order: 0, is_published: true },
  {
    label: "Ready-to-Wear",
    href: "/shop?collection=ready-to-wear",
    location: "header",
    sort_order: 1,
    is_published: true,
  },
  { label: "Bespoke", href: "/bespoke", location: "header", sort_order: 2, is_published: true },
  { label: "Bridal", href: "/bridal", location: "header", sort_order: 3, is_published: true },
  { label: "Who we are", href: "/about", location: "header", sort_order: 4, is_published: true },
  { label: "Experience", href: "/experience", location: "header", sort_order: 5, is_published: true },
];

const defaultCarousel = [
  {
    name: "Dolly Dress",
    image_url: "/images/products/dolly-dress.jpg",
    href: "/product/dolly-dress",
    sort_order: 0,
    is_published: true,
  },
  {
    name: "Puzzle Set",
    image_url: "/images/products/puzzle-set.jpg",
    href: "/product/puzzle-set",
    sort_order: 1,
    is_published: true,
  },
  {
    name: "Doja Pants Blue",
    image_url: "/images/products/doja-pants-female.jpg",
    href: "/product/doja-pants-blue",
    sort_order: 2,
    is_published: true,
  },
  {
    name: "Doja Pants Tan",
    image_url: "/images/products/doja-pants-tan.jpg",
    href: "/product/doja-pants-tan",
    sort_order: 3,
    is_published: true,
  },
  {
    name: "Doja Skirt Blue",
    image_url: "/images/products/doja-skirt-blue.jpg",
    href: "/product/doja-skirt-blue",
    sort_order: 4,
    is_published: true,
  },
  {
    name: "Doja Skirt Tan",
    image_url: "/images/products/doja-skirt-tan.jpg",
    href: "/product/doja-skirt-tan",
    sort_order: 5,
    is_published: true,
  },
  {
    name: "Rolly Pants",
    image_url: "/images/products/rolly-pants.jpg",
    href: "/product/rolly-pants",
    sort_order: 6,
    is_published: true,
  },
  {
    name: "Doja Pants — Men",
    image_url: "/images/products/doja-pants-men.jpg",
    href: "/product/doja-pants-men",
    sort_order: 7,
    is_published: true,
  },
  {
    name: "Akanni Set",
    image_url: "/images/products/akanni-set.jpg",
    href: "/product/akanni-set",
    sort_order: 8,
    is_published: true,
  },
  {
    name: "Rolly Set",
    image_url: "/images/products/rolly-set.jpg",
    href: "/product/rolly-set",
    sort_order: 9,
    is_published: true,
  },
];

function productRow(p: (typeof products)[number], i: number) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    story: p.story,
    price: p.price,
    compare_at: p.compareAt ?? null,
    images: p.images,
    category_slug: p.category,
    collection_slug: p.collection,
    colors: p.colors,
    sizes: p.sizes,
    material: p.material,
    rating: p.rating,
    review_count: p.reviews,
    stock: p.stock,
    tags: p.tags,
    featured: !!p.featured,
    new_arrival: !!p.newArrival,
    best_seller: !!p.bestSeller,
    trending: !!p.trending,
    is_published: true,
    sort_order: i,
  };
}

async function main() {
  console.log("Seeding MKoS CMS →", url);
  console.log(
    FORCE
      ? "Mode: --force (DESTRUCTIVE reset — overwrites CMS)"
      : "Mode: safe (preserves existing admin / live edits)"
  );
  if (SYNC_PRODUCTS && !FORCE) console.log("Also: --sync-products (upsert catalog rows only)");

  const probe = await supabase.from("products").select("id").limit(1);
  if (probe.error) {
    console.error("\nTables not found. Open Supabase → SQL Editor and run:");
    console.error("  supabase/migrations/001_cms_schema.sql\n");
    console.error("Error:", probe.error.message);
    process.exit(1);
  }

  if (FORCE) {
    console.warn("\n⚠  --force will delete and replace products, nav, carousel, content, etc.\n");
    await supabase.from("products").delete().neq("id", "__none__");
    await supabase.from("categories").delete().neq("slug", "__none__");
    await supabase.from("collections").delete().neq("slug", "__none__");
    await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("navigation_links")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("carousel_slides")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // Settings — only create if missing (unless force)
  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("id")
    .eq("id", "main")
    .maybeSingle();
  if (FORCE || !settingsRow) {
    await upsert(
      "site_settings",
      [
        {
          id: "main",
          brand_name: "MKoS",
          tagline: "For Those Who Understand STYLE.",
          logo_url: "/logo/mkos-logo.png",
          currency: "NGN",
          locale: "en-NG",
          free_shipping_threshold: 300000,
          shipping_fee: 28000,
          social: {
            instagram: "https://www.instagram.com/shopmykindofstyle",
            men: "https://www.instagram.com/mkosformen",
            whatsapp: "https://wa.me/2348143173661",
          },
        },
      ],
      "id"
    );
  } else {
    console.log("↷ site_settings (kept existing)");
  }

  // Categories / collections — insert missing only (or full replace on force)
  if (FORCE) {
    await upsert(
      "categories",
      categories.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        sort_order: i,
        is_published: true,
      })),
      "slug"
    );
    await upsert(
      "collections",
      collections.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        image_url: c.image,
        video_url: "video" in c ? ((c as { video?: string }).video ?? null) : null,
        sort_order: i,
        is_published: true,
      })),
      "slug"
    );
  } else {
    const existingCat = await existingKeys("categories", "slug");
    const newCats = categories
      .filter((c) => !existingCat.has(c.slug))
      .map((c, i) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        sort_order: existingCat.size + i,
        is_published: true,
      }));
    if (newCats.length) await upsert("categories", newCats, "slug");
    else console.log("↷ categories (kept existing)");

    const existingCol = await existingKeys("collections", "slug");
    const newCols = collections
      .filter((c) => !existingCol.has(c.slug))
      .map((c, i) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        image_url: c.image,
        video_url: "video" in c ? ((c as { video?: string }).video ?? null) : null,
        sort_order: existingCol.size + i,
        is_published: true,
      }));
    if (newCols.length) await upsert("collections", newCols, "slug");
    else console.log("↷ collections (kept existing)");
  }

  // Products
  if (FORCE || SYNC_PRODUCTS) {
    await upsert(
      "products",
      products.map((p, i) => productRow(p, i)),
      "id"
    );
  } else {
    const existingIds = await existingKeys("products", "id");
    const existingSlugs = await existingKeys("products", "slug");
    const missing = products
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !existingIds.has(p.id) && !existingSlugs.has(p.slug))
      .map(({ p, i }) => productRow(p, i));
    if (missing.length) await upsert("products", missing, "id");
    else console.log("↷ products (kept existing — use --sync-products to refresh catalog fields)");
  }

  // Reviews / FAQs — only when empty (or force)
  if (FORCE || (await countRows("reviews")) === 0) {
    if (!FORCE) {
      /* empty */
    }
    await upsert(
      "reviews",
      reviews.map((r, i) => ({
        author_name: r.name,
        location: r.location,
        rating: r.rating,
        body: r.text,
        product_name: r.product,
        sort_order: i,
        is_published: true,
      }))
    );
  } else {
    console.log("↷ reviews (kept existing)");
  }

  if (FORCE || (await countRows("faqs")) === 0) {
    await upsert(
      "faqs",
      faqs.map((f, i) => ({
        question: f.q,
        answer: f.a,
        sort_order: i,
        is_published: true,
      }))
    );
  } else {
    console.log("↷ faqs (kept existing)");
  }

  // Navigation — never overwrite unless force / empty
  if (FORCE || (await countRows("navigation_links")) === 0) {
    await upsert("navigation_links", defaultNav);
  } else {
    // Ensure Bridal exists if somehow missing, without touching other links
    const { data: nav } = await supabase.from("navigation_links").select("href");
    const hrefs = new Set((nav ?? []).map((n) => String(n.href)));
    if (!hrefs.has("/bridal")) {
      await upsert("navigation_links", [
        {
          label: "Bridal",
          href: "/bridal",
          location: "header",
          sort_order: 3,
          is_published: true,
        },
      ]);
      console.log("✓ navigation_links (added missing Bridal only)");
    } else {
      console.log("↷ navigation_links (kept existing)");
    }
  }

  if (FORCE || (await countRows("carousel_slides")) === 0) {
    await upsert("carousel_slides", defaultCarousel);
  } else {
    console.log("↷ carousel_slides (kept existing)");
  }

  const { data: newsletter } = await supabase
    .from("newsletter_settings")
    .select("id")
    .eq("id", "main")
    .maybeSingle();
  if (FORCE || !newsletter) {
    await upsert(
      "newsletter_settings",
      [
        {
          id: "main",
          eyebrow: "Newsletter",
          title: "Be first to know.",
          subtitle: "Studio drops, fittings, and new collections — straight from Oniru.",
          button_label: "Subscribe",
        },
      ],
      "id"
    );
  } else {
    console.log("↷ newsletter_settings (kept existing)");
  }

  // Site content — insert missing keys only (unless force)
  if (FORCE) {
    await upsert(
      "site_content",
      contentBlocks.map((b) => ({
        ...b,
        extra: "extra" in b && b.extra != null ? b.extra : {},
        is_published: true,
      })),
      "key"
    );
  } else {
    const existingContent = await existingKeys("site_content", "key");
    const missingContent = contentBlocks
      .filter((b) => !existingContent.has(b.key))
      .map((b) => ({
        ...b,
        extra: "extra" in b && b.extra != null ? b.extra : {},
        is_published: true,
      }));
    if (missingContent.length) await upsert("site_content", missingContent, "key");
    else console.log("↷ site_content (kept existing admin copy)");
  }

  console.log(
    FORCE
      ? "\nForce seed complete. CMS was reset from code defaults."
      : "\nSafe seed complete. Existing CMS edits were preserved."
  );
  console.log("Tips:");
  console.log("  npx tsx scripts/seed-cms.ts                # safe (default)");
  console.log("  npx tsx scripts/seed-cms.ts --sync-products # refresh product fields only");
  console.log("  npx tsx scripts/seed-cms.ts --force         # full reset (destructive)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
