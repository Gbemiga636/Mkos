import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type {
  Product,
  ProductColor,
  Category,
  Collection,
  Review,
  Faq,
  SiteContentBlock,
  SiteSettings,
  NavLink,
  CarouselSlide,
  CmsSnapshot,
} from "@/lib/cms/types";
import {
  products as fallbackProducts,
  categories as fallbackCategories,
  collections as fallbackCollections,
  reviews as fallbackReviews,
  faqs as fallbackFaqs,
} from "@/data/products";
import { BRAND_NAME, normalizeBrandText } from "@/lib/brand";
import { parseProductImages, normalizeFocus } from "@/lib/media/imageFocus";

/** Accept string[] or { name, hex }[] from DB / seeds. */
function normalizeProductColors(raw: unknown): ProductColor[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductColor[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name) out.push({ name, hex: "" });
      continue;
    }
    if (entry && typeof entry === "object" && "name" in entry) {
      const name = String((entry as { name?: unknown }).name ?? "").trim();
      if (!name) continue;
      const hex = String((entry as { hex?: unknown }).hex ?? "").trim();
      out.push({ name, hex });
    }
  }
  return out;
}

/** Legacy women/men collections → primary offerings (RTW / Bespoke / Bridal). */
function normalizeCollectionSlug(slug: string) {
  if (slug === "women" || slug === "men") return "ready-to-wear";
  if (slug === "custom") return "bespoke";
  return slug;
}

/** Legacy product category_slug values → current taxonomy. */
function normalizeCategorySlug(slug: string) {
  if (slug === "ready-to-wear" || slug === "women") return "women-rtw";
  if (slug === "men") return "men-rtw";
  if (slug === "custom") return "women-bespoke";
  if (slug === "bridal") return "bridal-party";
  return slug;
}

/** Old category rows that remap onto the new taxonomy — drop from nav/filters. */
const LEGACY_CATEGORY_SLUGS = new Set([
  "ready-to-wear",
  "women",
  "men",
  "custom",
  "bridal",
]);

function dedupeCategories(list: Category[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const c of list) {
    if (LEGACY_CATEGORY_SLUGS.has(c.slug)) continue;
    const slug = normalizeCategorySlug(c.slug);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...c, slug });
  }
  return out;
}

function mapProduct(row: Record<string, unknown>): Product {
  const rawCollection = String(row.collection_slug ?? "");
  const rawCategory = String(row.category_slug ?? "");
  const slug = String(row.slug ?? "");

  // Immediate storefront fix: ensure Boubou products land under the Boubou RTW category
  const category =
    slug === "abeni-boubou" ? "boubou" : normalizeCategorySlug(rawCategory);
  const collection =
    slug === "abeni-boubou" ? "ready-to-wear" : normalizeCollectionSlug(rawCollection);
  const parsedImages = parseProductImages(row.images);
  return {
    id: String(row.id),
    slug,
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    story: String(row.story ?? ""),
    price: Number(row.price),
    priceUsd:
      row.price_usd != null && Number(row.price_usd) > 0
        ? Number(row.price_usd)
        : undefined,
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    images: parsedImages.images,
    imageFocus: parsedImages.imageFocus,
    category,
    collection,
    colors: normalizeProductColors(row.colors),
    sizes: Array.isArray(row.sizes)
      ? (row.sizes as unknown[]).map(String).filter(Boolean)
      : [],
    material: String(row.material ?? ""),
    rating: Number(row.rating ?? 5),
    reviews: Number(row.review_count ?? 0),
    stock: Number(row.stock ?? 0),
    tags: (row.tags as string[]) ?? [],
    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
    trending: Boolean(row.trending),
  };
}

function fallbackSnapshot(): CmsSnapshot {
  const content: Record<string, SiteContentBlock> = {
    hero: {
      key: "hero",
      section: "hero",
      eyebrow: "My Kind of Style",
      title: "For Those Who\nUnderstand STYLE.",
      subtitle:
        "Nigerian contemporary fashion — timeless style that blends modern design with African heritage.",
      cta_label: "Our services",
      cta_href: "/#services",
      media_url: "/videos/hero-bg.mp4",
      media_type: "video",
      extra: { secondary_cta_label: "Our story", secondary_cta_href: "/about" },
    },
    campaign: {
      key: "campaign",
      section: "campaign",
      eyebrow: "",
      title: "Style should be personal.",
      subtitle: "",
      cta_label: "Shop Ready-to-Wear",
      cta_href: "/shop?collection=ready-to-wear",
      media_url: "/videos/style.mp4",
      media_type: "video",
    },
    editorial: {
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
    },
    featured_video: {
      key: "featured_video",
      section: "featured_video",
      eyebrow: "",
      title: "MKoS in motion",
      subtitle: "A quiet look at the house — then step into the Experience.",
      cta_label: "Enter the Experience",
      cta_href: "/experience",
      media_url: "/videos/mkos-in-motion.mp4",
      media_type: "video",
    },
    experience_video: {
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
    },
    bespoke_video: {
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
    },
    bridal_video: {
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
    },
    brand_story: {
      key: "brand_story",
      section: "brand_story",
      eyebrow: "About MKoS",
      title: "My Kind of Style.",
      body: "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.\n\nMore than a fashion label, MKoS is a lifestyle brand that seamlessly blends contemporary design with African heritage — elegant, sophisticated, and distinctive.\n\nThe MKoS MASTER Standard defines our core values: MKoS defines who we are; MASTER defines how we work.",
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
    },
    new_arrivals: {
      key: "new_arrivals",
      section: "new_arrivals",
      eyebrow: "New Arrivals",
      title: "Fresh from the studio.",
      subtitle:
        "The latest ready to wear collections crafted with care and precision for both men and women.",
    },
    trending: {
      key: "trending",
      section: "trending",
      eyebrow: "Trending",
      title: "What clients are choosing.",
      subtitle: "Statement silhouettes and heritage details that define the season.",
    },
    best_sellers: {
      key: "best_sellers",
      section: "best_sellers",
      eyebrow: "Best Sellers",
      title: "Styles that stay with you.",
    },
    featured_collections: {
      key: "featured_collections",
      section: "featured_collections",
      eyebrow: "Collections",
      title: "Designed for Every Defining Moment.",
      subtitle:
        "Women’s wear. Men’s wear. Bespoke. Bridal — four ways to experience MKoS, each thoughtfully made for those who understand style.",
    },
    carousel: {
      key: "carousel",
      section: "carousel",
      eyebrow: "Lookbook",
      title: "Move through the house.",
      subtitle: "Scroll through Ready-to-Wear, Bespoke, and Bridal — style for every expression.",
    },
    categories: {
      key: "categories",
      section: "categories",
      eyebrow: "Within the collections",
      title: "Find your kind of style.",
      subtitle: "Women’s style, Men’s style, and Boubou — within the collections.",
    },
    reviews: {
      key: "reviews",
      section: "reviews",
      eyebrow: "Love notes",
      title: "From the MKoS feed.",
    },
    instagram: {
      key: "instagram",
      section: "instagram",
      eyebrow: "@shopmykindofstyle",
      title: "Life in the edit.",
      subtitle: "For those who understand style.",
      cta_label: "Follow on Instagram",
      cta_href: "https://www.instagram.com/shopmykindofstyle",
    },
    faq: {
      key: "faq",
      section: "faq",
      eyebrow: "FAQ",
      title: "Answers from the studio.",
      subtitle: "Studio visits, custom orders, and how to reach us.",
    },
    footer: {
      key: "footer",
      section: "footer",
      eyebrow: "Stay close",
      title: "For Those Who Understand STYLE.",
    },
    marquee: {
      key: "marquee",
      section: "marquee",
      body: "MKoS · MY KIND OF STYLE · FOR THOSE WHO UNDERSTAND STYLE · MKoS MASTER STANDARD · ",
    },
    shop: {
      key: "shop",
      section: "shop",
      eyebrow: "Shop",
      title: "The MKoS collections.",
      subtitle: "Women’s style, Men’s style, and Boubou. Pricing managed via admin.",
    },
  };

  return {
    settings: {
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
    products: fallbackProducts,
    categories: fallbackCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
    })),
    collections: fallbackCollections.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      video: "video" in c && typeof c.video === "string" ? c.video : undefined,
      imageFocus:
        c.slug === "bridal" ? normalizeFocus({ x: 50, y: 28 }) : normalizeFocus({ x: 50, y: 50 }),
    })),
    reviews: fallbackReviews,
    faqs: fallbackFaqs,
    content,
    navigation: [
      { label: "Home", href: "/", location: "header" },
      { label: "Ready-to-Wear", href: "/shop?collection=ready-to-wear", location: "header" },
      { label: "Bespoke", href: "/bespoke", location: "header" },
      { label: "Bridal", href: "/bridal", location: "header" },
      { label: "Who we are", href: "/about", location: "header" },
      { label: "Experience", href: "/experience", location: "header" },
    ],
    carousel: [
      { name: "Abeni Boubou", image_url: "/images/products/abeni-boubou.jpg", href: "/product/abeni-boubou" },
      { name: "Rolly Set", image_url: "/images/products/rolly-set.jpg", href: "/product/rolly-set" },
      { name: "Puzzle Dress", image_url: "/images/products/puzzle-dress.jpg", href: "/product/puzzle-dress" },
      { name: "Jagu Jacket", image_url: "/images/products/jagu-jacket.jpg", href: "/product/jagu-jacket" },
      { name: "Asake Pants", image_url: "/images/products/asake-pants.jpg", href: "/product/asake-pants" },
      { name: "Sheed Set", image_url: "/images/products/sheed-set.jpg", href: "/product/sheed-set" },
    ],
    newsletter: {
      eyebrow: "Newsletter",
      title: "Be first to know.",
      subtitle: "Studio drops, fittings, and new collections — straight from Oniru.",
      button_label: "Subscribe",
    },
  };
}

async function loadCmsSnapshot(): Promise<CmsSnapshot> {
  const fallback = fallbackSnapshot();
  try {
    const supabase = createServiceClient();

    const [
      settingsRes,
      productsRes,
      categoriesRes,
      collectionsRes,
      reviewsRes,
      faqsRes,
      contentRes,
      navRes,
      carouselRes,
      newsletterRes,
    ] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
      supabase.from("products").select("*").eq("is_published", true).order("sort_order").order("id"),
      supabase.from("categories").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("collections").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("reviews").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("faqs").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("site_content").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("navigation_links").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("carousel_slides").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("newsletter_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    // If core tables missing, fall back silently
    if (productsRes.error || !productsRes.data?.length) {
      console.warn("[cms] Using local fallback:", productsRes.error?.message ?? "no products");
      return fallback;
    }

    const content: Record<string, SiteContentBlock> = { ...fallback.content };
    for (const row of contentRes.data ?? []) {
      content[row.key] = {
        key: row.key,
        section: row.section,
        title: row.title,
        subtitle: row.subtitle,
        body: row.body,
        eyebrow: row.eyebrow,
        cta_label: row.cta_label,
        cta_href: row.cta_href,
        media_url: row.media_url,
        media_type: row.media_type,
        extra: (row.extra as Record<string, unknown>) ?? {},
      };
    }

    // Prefer primary-collection framing over legacy Women/Men/paths copy only
    const featured = content.featured_collections;
    if (
      featured &&
      (/Women\.\s*Men/i.test(featured.title || "") ||
        /three paths/i.test(featured.subtitle || ""))
    ) {
      content.featured_collections = fallback.content.featured_collections;
    }
    if (content.campaign?.cta_href?.includes("collection=women")) {
      content.campaign = {
        ...content.campaign,
        cta_label: content.campaign.cta_label || "Shop Ready-to-Wear",
        cta_href: "/shop?collection=ready-to-wear",
      };
    }
    // Campaign video is hard-coded to style.mp4 in CampaignSection.
    // Do not rewrite CMS campaign media here — preserves admin panel values.
    if (content.categories && /Custom, Men/i.test(content.categories.subtitle || "")) {
      content.categories = {
        ...content.categories,
        subtitle: fallback.content.categories?.subtitle ?? content.categories.subtitle,
      };
    }
    if (content.marquee?.body && /craftsmanship|aso\s*oke/i.test(content.marquee.body)) {
      content.marquee = {
        ...content.marquee,
        body: content.marquee.body
          .replace(/\s*[·•|]\s*craftsmanship\s*/gi, " · ")
          .replace(/\s*[·•|]\s*aso\s*oke\s*/gi, " · ")
          .replace(/\bcraftsmanship\b/gi, "")
          .replace(/\baso\s*oke\b/gi, "")
          .replace(/\s*·\s*·\s*/g, " · ")
          .replace(/\s{2,}/g, " ")
          .trim(),
      };
      if (!content.marquee.body || content.marquee.body === "·") {
        content.marquee = fallback.content.marquee;
      } else if (!content.marquee.body.endsWith(" · ") && !content.marquee.body.endsWith("· ")) {
        content.marquee.body = `${content.marquee.body.replace(/\s*·?\s*$/, "")} · `;
      }
    }

    // Do NOT overwrite admin CMS copy here — only fix broken/legacy media paths
    if (content.featured_video) {
      const fv = content.featured_video;
      if (!fv.media_url || /experience-3/i.test(fv.media_url)) {
        fv.media_url = "/videos/mkos-in-motion.mp4";
        fv.media_type = "video";
      }
    }

    // Soft rename: "pieces" → "styles" without replacing whole blocks
    const replacePieces = (value: unknown): unknown => {
      if (typeof value === "string") return value.replace(/\bpieces\b/gi, "styles");
      if (Array.isArray(value)) return value.map(replacePieces);
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, replacePieces(v)])
        );
      }
      return value;
    };
    for (const key of Object.keys(content)) {
      content[key] = replacePieces(content[key]) as SiteContentBlock;
    }

    const settings: SiteSettings = settingsRes.data
      ? {
          brand_name: normalizeBrandText(settingsRes.data.brand_name || BRAND_NAME),
          tagline: settingsRes.data.tagline,
          logo_url: settingsRes.data.logo_url,
          currency: settingsRes.data.currency,
          locale: settingsRes.data.locale,
          free_shipping_threshold: Number(settingsRes.data.free_shipping_threshold),
          shipping_fee: Number(settingsRes.data.shipping_fee),
          social: (settingsRes.data.social as Record<string, string>) ?? {},
        }
      : fallback.settings;

    const products = productsRes.data.map((row) => mapProduct(row as Record<string, unknown>));

    const categories: Category[] = (() => {
      const fromDb =
        categoriesRes.data?.map((c) => ({
          slug: c.slug,
          name:
            c.slug === "women-rtw"
              ? "Women’s style"
              : c.slug === "men-rtw"
                ? "Men’s style"
                : c.name,
          description: c.description ?? "",
          image_url: c.image_url,
        })) ?? [];
      const hasNew = fromDb.some((c) =>
        ["women-rtw", "men-rtw", "women-bespoke", "aso-ebi"].includes(c.slug)
      );
      if (!fromDb.length || !hasNew) return [...fallback.categories];
      const deduped = dedupeCategories(fromDb);
      // Ensure the RTW filters always include Boubou (even before DB migration/seed)
      if (!deduped.some((c) => c.slug === "boubou")) {
        const boubou = fallback.categories.find((c) => c.slug === "boubou");
        if (boubou) deduped.push(boubou);
      }
      return deduped.length ? deduped : [...fallback.categories];
    })();

    let collections: Collection[] = (() => {
      const fromDb =
        collectionsRes.data?.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description ?? "",
          image: c.image_url ?? "",
          video: c.video_url ?? undefined,
          imageFocus: normalizeFocus(
            (c as { image_focus?: { x?: number; y?: number } | null }).image_focus ??
              (c.slug === "bridal" ? { x: 50, y: 28 } : { x: 50, y: 50 })
          ),
        })) ?? [];
      // Prefer primary offerings (RTW / Bespoke / Bridal) over legacy Women/Men framing
      const hasPrimary = fromDb.some((c) =>
        ["ready-to-wear", "bespoke", "bridal"].includes(c.slug)
      );
      const isLegacyGender =
        fromDb.length > 0 &&
        fromDb.every((c) => ["women", "men", "bridal"].includes(c.slug));
      if (!fromDb.length || isLegacyGender || !hasPrimary) {
        return fallback.collections;
      }
      return fromDb;
    })();

    // Ensure collection cover images match an actual product in that collection
    const firstProductImageByCollection = new Map<string, string>();
    for (const p of products) {
      if (!firstProductImageByCollection.has(p.collection) && p.images?.[0]) {
        firstProductImageByCollection.set(p.collection, p.images[0]);
      }
    }
    collections = collections.map((c) => {
      if (c.slug === "bespoke") {
        return { ...c, image: "/images/collections/bespoke-cover.jpg" };
      }
      if (c.slug === "bridal") {
        return {
          ...c,
          image: "/images/collections/bridal-cover.jpg",
          imageFocus: c.imageFocus ?? normalizeFocus({ x: 50, y: 28 }),
        };
      }
      const img = firstProductImageByCollection.get(c.slug);
      return img ? { ...c, image: img } : c;
    });

    // Optional focus map stored on featured_collections.extra (fallback before DB column)
    const focusMap = (content.featured_collections?.extra?.collectionFocus || {}) as Record<
      string,
      { x?: number; y?: number }
    >;
    if (focusMap && typeof focusMap === "object") {
      collections = collections.map((c) =>
        focusMap[c.slug] ? { ...c, imageFocus: normalizeFocus(focusMap[c.slug]) } : c
      );
    }

    const reviewsFromDb =
      reviewsRes.data?.map((r) => ({
        id: r.id,
        name: String(r.author_name ?? ""),
        location: String(r.location ?? ""),
        rating: Number(r.rating ?? 5),
        text: String(r.body ?? ""),
        product: String(r.product_name ?? ""),
      })) ?? [];

    const reviewsLegacy = reviewsFromDb.some((r) =>
      /Adaeze|Tunde A\.|Chioma E\.|Kemi B\./i.test(r.name)
    );

    const reviews: Review[] =
      !reviewsFromDb.length || reviewsLegacy ? fallback.reviews : reviewsFromDb;

    const faqs: Faq[] =
      faqsRes.data?.map((f) => ({
        id: f.id,
        q: f.question,
        a: f.answer,
      })) ?? fallback.faqs;

    const navigation: NavLink[] = (() => {
      let fromDb =
        navRes.data?.map((n) => ({
          label: n.label,
          href: n.href,
          location: n.location,
        })) ?? null;
      if (!fromDb?.length) return fallback.navigation;

      // Rewrite legacy Women/Men collection links to primary offerings
      const hasLegacyGenderNav = fromDb.some(
        (n) => n.href === "/shop?collection=women" || n.href === "/shop?collection=men"
      );
      if (hasLegacyGenderNav) {
        fromDb = fromDb.flatMap((n) => {
          if (n.href === "/shop?collection=women") {
            return [
              { label: "Ready-to-Wear", href: "/shop?collection=ready-to-wear", location: n.location },
              { label: "Bespoke", href: "/bespoke", location: n.location },
            ];
          }
          if (n.href === "/shop?collection=men") {
            return [];
          }
          return [n];
        });
      }

      fromDb = fromDb
        .map((n) => {
          if (n.href === "/shop?collection=bespoke") return { ...n, href: "/bespoke", label: n.label || "Bespoke" };
          if (n.href === "/shop?collection=bridal" || n.href === "/#collections") {
            if (n.label.toLowerCase() === "bridal") return { ...n, href: "/bridal", label: "Bridal" };
          }
          if (n.href === "/about" && /^story$/i.test(n.label)) {
            return { ...n, label: "Who we are" };
          }
          return n;
        });

      if (!fromDb.some((n) => n.href === "/bridal")) {
        const bespokeIdx = fromDb.findIndex((n) => n.href === "/bespoke");
        const insertAt = bespokeIdx >= 0 ? bespokeIdx + 1 : Math.min(3, fromDb.length);
        fromDb = [
          ...fromDb.slice(0, insertAt),
          { label: "Bridal", href: "/bridal", location: "header" },
          ...fromDb.slice(insertAt),
        ];
      }

      if (!fromDb.some((n) => n.href === "/experience")) {
        const storyIdx = fromDb.findIndex((n) => n.href === "/about");
        const insertAt = storyIdx >= 0 ? storyIdx + 1 : Math.min(4, fromDb.length);
        fromDb = [
          ...fromDb.slice(0, insertAt),
          { label: "Experience", href: "/experience", location: "header" },
          ...fromDb.slice(insertAt),
        ];
      }

      // Style Brief / Account / Journal / Shop stay off the public menu for now
      fromDb = fromDb.filter(
        (n) =>
          n.href !== "/style-brief" &&
          n.href !== "/account" &&
          n.href !== "/blog" &&
          n.href !== "/shop" &&
          !n.href.includes("/account") &&
          n.label.toLowerCase() !== "account" &&
          n.label.toLowerCase() !== "sign in" &&
          n.label.toLowerCase() !== "journal" &&
          n.label.toLowerCase() !== "shop"
      );

      return fromDb.filter((n, i, arr) => arr.findIndex((x) => x.href === n.href) === i);
    })();

    const carousel: CarouselSlide[] =
      carouselRes.data?.map((s) => ({
        name: s.name,
        image_url: s.image_url,
        href: s.href,
      })) ?? fallback.carousel;

    const newsletter = newsletterRes.data
      ? {
          eyebrow: newsletterRes.data.eyebrow ?? fallback.newsletter.eyebrow,
          title: newsletterRes.data.title ?? fallback.newsletter.title,
          subtitle: newsletterRes.data.subtitle ?? fallback.newsletter.subtitle,
          button_label: newsletterRes.data.button_label ?? fallback.newsletter.button_label,
        }
      : fallback.newsletter;

    return {
      settings,
      products,
      categories,
      collections,
      reviews,
      faqs,
      content,
      navigation,
      carousel,
      newsletter,
    };
  } catch (err) {
    console.warn("[cms] Supabase unavailable, using fallback", err);
    return fallback;
  }
}

/** Cross-request CMS cache — ~5 min, busted by revalidateTag("cms") on admin saves. */
const getCachedCmsSnapshot = unstable_cache(loadCmsSnapshot, ["cms-snapshot-v2"], {
  revalidate: 300,
  tags: ["cms"],
});

/** Request-scoped dedupe + shared tag cache for all storefront pages. */
export const getCmsSnapshot = cache(async (): Promise<CmsSnapshot> => getCachedCmsSnapshot());

export async function getProductBySlug(slug: string) {
  const cms = await getCmsSnapshot();
  return cms.products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const cms = await getCmsSnapshot();
  return cms.products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.collection === product.collection || p.category === product.category)
    )
    .slice(0, limit);
}
