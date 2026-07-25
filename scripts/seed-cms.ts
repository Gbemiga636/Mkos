/**
 * Seeds Supabase with the full MKOS site content.
 * Prerequisites: run supabase/migrations/001_cms_schema.sql in the SQL Editor first.
 *
 * Usage: npx tsx scripts/seed-cms.ts
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

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsert(table: string, rows: Record<string, unknown>[], onConflict?: string) {
  const q = supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  const { error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table} (${rows.length})`);
}

async function main() {
  console.log("Seeding MKOS CMS →", url);

  const probe = await supabase.from("products").select("id").limit(1);
  if (probe.error) {
    console.error("\nTables not found. Open Supabase → SQL Editor and run:");
    console.error("  supabase/migrations/001_cms_schema.sql\n");
    console.error("Error:", probe.error.message);
    process.exit(1);
  }

  await upsert("site_settings", [
    {
      id: "main",
      brand_name: "MKOS",
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
  ]);

  // Replace categories / collections / products so old placeholders disappear
  await supabase.from("products").delete().neq("id", "__none__");
  await supabase.from("categories").delete().neq("slug", "__none__");
  await supabase.from("collections").delete().neq("slug", "__none__");

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
      video_url: "video" in c ? (c as { video?: string }).video ?? null : null,
      sort_order: i,
      is_published: true,
    })),
    "slug"
  );

  await upsert(
    "products",
    products.map((p, i) => ({
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
    })),
    "id"
  );

  await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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

  await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await upsert(
    "faqs",
    faqs.map((f, i) => ({
      question: f.q,
      answer: f.a,
      sort_order: i,
      is_published: true,
    }))
  );

  await supabase.from("navigation_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await upsert("navigation_links", [
    { label: "Home", href: "/", location: "header", sort_order: 0 },
    { label: "Shop", href: "/shop", location: "header", sort_order: 1 },
    { label: "Women", href: "/shop?collection=women", location: "header", sort_order: 2 },
    { label: "Men", href: "/shop?collection=men", location: "header", sort_order: 3 },
    { label: "Story", href: "/about", location: "header", sort_order: 4 },
    { label: "Account", href: "/account", location: "header", sort_order: 5 },
  ]);

  await supabase.from("carousel_slides").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await upsert("carousel_slides", [
    {
      name: "Abeni Boubou",
      image_url: "/images/products/abeni-boubou.jpg",
      href: "/product/abeni-boubou",
      sort_order: 0,
    },
    {
      name: "Rolly Set",
      image_url: "/images/products/rolly-set.jpg",
      href: "/product/rolly-set",
      sort_order: 1,
    },
    {
      name: "Puzzle Dress",
      image_url: "/images/products/puzzle-dress.jpg",
      href: "/product/puzzle-dress",
      sort_order: 2,
    },
    {
      name: "Jagu Jacket",
      image_url: "/images/products/jagu-jacket.jpg",
      href: "/product/jagu-jacket",
      sort_order: 3,
    },
    {
      name: "Asake Pants",
      image_url: "/images/products/asake-pants.jpg",
      href: "/product/asake-pants",
      sort_order: 4,
    },
    {
      name: "Sheed Set",
      image_url: "/images/products/sheed-set.jpg",
      href: "/product/sheed-set",
      sort_order: 5,
    },
  ]);

  await upsert("newsletter_settings", [
    {
      id: "main",
      eyebrow: "Newsletter",
      title: "Be first to know.",
      subtitle: "Studio drops, fittings, and new collections — straight from Oniru.",
      button_label: "Subscribe",
    },
  ]);

  const contentBlocks = [
    {
      key: "hero",
      section: "hero",
      eyebrow: "My Kind of Style",
      title: "For Those Who\nUnderstand STYLE.",
      subtitle:
        "Nigerian contemporary fashion — timeless pieces that blend modern design with African heritage.",
      cta_label: "Shop the collection",
      cta_href: "/shop",
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
      subtitle:
        "Clean modern tailoring, premium fabrics, and traditional textiles including Aso Oke — for a global luxury audience.",
      cta_label: "Shop women",
      cta_href: "/shop?collection=women",
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
          "For Those Who Understand STYLE.",
          "MKoS defines who we are.",
          "MASTER defines how we work.",
          "Together—the MKoS MASTER Standard.",
        ],
      },
      sort_order: 2,
    },
    {
      key: "featured_video",
      section: "featured_video",
      eyebrow: "Featured Film",
      title: "MKOS in motion",
      media_url: "/videos/white-space.mp4",
      media_type: "video",
      sort_order: 3,
    },
    {
      key: "brand_story",
      section: "brand_story",
      eyebrow: "About MKOS",
      title: "My Kind of Style.",
      body: "MKOS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.\n\nMore than a fashion label, MKOS is a lifestyle brand that seamlessly blends contemporary design with African heritage — elegant, sophisticated, and distinctive.\n\nThe MKoS MASTER Standard defines our core values: MKoS defines who we are; MASTER defines how we work.",
      cta_label: "Explore the shop",
      cta_href: "/shop",
      media_url: "/images/products/abeni-boubou.jpg",
      media_type: "image",
      extra: {
        promise: "For Those Who Understand STYLE.",
        mission:
          "To create timeless luxury fashion that celebrates individuality through exceptional craftsmanship, contemporary design, and African heritage—delivering bespoke experiences that inspire confidence, elegance, and enduring style.",
        vision:
          "To become Africa’s most admired luxury fashion house, recognised globally for redefining modern African luxury through innovation, authenticity, craftsmanship, sustainability, and exceptional customer experiences.",
        master_intro:
          "At MKoS, our name is more than a brand—it is our philosophy. MKoS defines who we are. MASTER defines how we work. Together, they form the MKoS MASTER Standard—the principles that guide every decision, every design, every relationship, and every client experience.",
        values: [
          {
            title: "M — Mastery",
            text: "We pursue excellence in craftsmanship, service, and every client experience.",
          },
          {
            title: "K — Know Your Authenticity",
            text: "We honour African heritage while celebrating individuality, culture, identity, and the confidence to express your own style.",
          },
          {
            title: "O — Own It",
            text: "We lead with integrity, accountability, and professionalism, taking ownership of every promise we make and every experience we deliver.",
          },
          {
            title: "S — Shape the Future",
            text: "We embrace innovation, sustainability, versatility, and continuous improvement to create timeless fashion with lasting impact.",
          },
        ],
        mkos: [
          {
            letter: "M",
            title: "Mastery",
            text: "We pursue excellence in craftsmanship, service, and every client experience.",
          },
          {
            letter: "K",
            title: "Know Your Authenticity",
            text: "We honour African heritage while celebrating individuality, culture, identity, and the confidence to express your own style.",
          },
          {
            letter: "O",
            title: "Own It",
            text: "We lead with integrity, accountability, and professionalism, taking ownership of every promise we make and every experience we deliver.",
          },
          {
            letter: "S",
            title: "Shape the Future",
            text: "We embrace innovation, sustainability, versatility, and continuous improvement to create timeless fashion with lasting impact.",
          },
        ],
        master: [
          {
            letter: "M",
            title: "Mastery",
            text: "We pursue excellence in everything we create and every experience we deliver.",
          },
          {
            letter: "A",
            title: "Authenticity",
            text: "We remain true to our heritage, our craftsmanship, and our commitment to creating meaningful luxury.",
          },
          {
            letter: "S",
            title: "Sustainability",
            text: "We believe true sustainability begins with intentional design. We create versatile, timeless pieces that can be styled in multiple ways, worn across occasions, and cherished for years—encouraging conscious fashion over fast fashion while respecting our people, our craft, and our environment.",
          },
          {
            letter: "T",
            title: "Timeless Elegance",
            text: "We create refined designs that transcend trends and inspire confidence.",
          },
          {
            letter: "E",
            title: "Empowerment",
            text: "We foster a culture of respect, collaboration, ownership, and continuous learning, empowering our people, artisans, partners, and clients to thrive.",
          },
          {
            letter: "R",
            title: "Responsibility",
            text: "We lead with integrity, professionalism, accountability, and a commitment to delivering on every promise.",
          },
        ],
      },
      sort_order: 4,
    },
    {
      key: "new_arrivals",
      section: "new_arrivals",
      eyebrow: "New Arrivals",
      title: "Fresh from the studio.",
      subtitle: "The latest Ready-to-Wear and MKoS Men pieces — crafted with care and presence.",
      sort_order: 5,
    },
    {
      key: "trending",
      section: "trending",
      eyebrow: "Trending",
      title: "What clients are choosing.",
      subtitle: "Statement silhouettes and heritage details that define the season.",
      sort_order: 6,
    },
    {
      key: "best_sellers",
      section: "best_sellers",
      eyebrow: "Best Sellers",
      title: "Pieces that stay with you.",
      sort_order: 7,
    },
    {
      key: "featured_collections",
      section: "featured_collections",
      eyebrow: "Collections",
      title: "Women. Men. Bridal.",
      subtitle:
        "Three paths into MKOS — Ready-to-Wear and custom for women, contemporary menswear, and bridal celebrations.",
      sort_order: 8,
    },
    {
      key: "carousel",
      section: "carousel",
      eyebrow: "Lookbook",
      title: "Move through the house.",
      subtitle: "Scroll through the season — women, men, and statement pieces.",
      sort_order: 9,
    },
    {
      key: "categories",
      section: "categories",
      eyebrow: "Shop by",
      title: "Find your kind of style.",
      subtitle: "Ready-to-Wear, Aso Ebi, Custom, Men, and Bridal.",
      sort_order: 10,
    },
    {
      key: "reviews",
      section: "reviews",
      eyebrow: "Client Voices",
      title: "Worn with confidence.",
      sort_order: 11,
    },
    {
      key: "instagram",
      section: "instagram",
      eyebrow: "@shopmykindofstyle",
      title: "Life in the edit.",
      subtitle: "Follow MKOS and MKoS Men on Instagram.",
      cta_label: "Follow on Instagram",
      cta_href: "https://www.instagram.com/shopmykindofstyle",
      sort_order: 12,
    },
    {
      key: "faq",
      section: "faq",
      eyebrow: "FAQ",
      title: "Answers from the studio.",
      subtitle: "Studio visits, custom orders, and how to reach us.",
      sort_order: 13,
    },
    {
      key: "footer",
      section: "footer",
      eyebrow: "Stay close",
      title: "For Those Who Understand STYLE.",
      sort_order: 14,
    },
    {
      key: "marquee",
      section: "marquee",
      body: "MKOS · MY KIND OF STYLE · FOR THOSE WHO UNDERSTAND STYLE · MKoS MASTER STANDARD · ",
      sort_order: 15,
    },
    {
      key: "shop",
      section: "shop",
      eyebrow: "Shop",
      title: "The full collection.",
      subtitle: "Women, men, and bridal — filter by collection or category. Pricing coming via admin.",
      sort_order: 16,
    },
  ];

  await upsert(
    "site_content",
    contentBlocks.map((b) => ({
      ...b,
      extra: "extra" in b && b.extra != null ? b.extra : {},
      is_published: true,
    })),
    "key"
  );

  console.log("\nSeed complete. Storefront will now read from Supabase.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
