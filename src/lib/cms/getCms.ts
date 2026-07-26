import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type {
  Product,
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

/** Prefer a single primary image format; drop duplicate .webp siblings. */
function normalizeImages(images: string[] | null | undefined): string[] {
  const list = images ?? [];
  const jpgPreferred = list.filter((src) => !src.toLowerCase().endsWith(".webp"));
  const unique = Array.from(new Set(jpgPreferred.length ? jpgPreferred : list));
  return unique;
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    story: String(row.story ?? ""),
    price: Number(row.price),
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    images: normalizeImages(row.images as string[]),
    category: String(row.category_slug ?? ""),
    collection: String(row.collection_slug ?? ""),
    colors: (row.colors as Product["colors"]) ?? [],
    sizes: (row.sizes as string[]) ?? [],
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
        "Nigerian contemporary fashion — timeless pieces that blend modern design with African heritage.",
      cta_label: "Shop the collection",
      cta_href: "/shop",
      media_url: "/videos/hero-bg.mp4",
      media_type: "video",
      extra: { secondary_cta_label: "Our story", secondary_cta_href: "/about" },
    },
    campaign: {
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
    },
    editorial: {
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
    },
    featured_video: {
      key: "featured_video",
      section: "featured_video",
      eyebrow: "Featured Film",
      title: "MKOS in motion",
      media_url: "/videos/white-space.mp4",
      media_type: "video",
    },
    brand_story: {
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
    },
    new_arrivals: {
      key: "new_arrivals",
      section: "new_arrivals",
      eyebrow: "New Arrivals",
      title: "Fresh from the studio.",
      subtitle: "The latest Ready-to-Wear and MKoS Men pieces — crafted with care and presence.",
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
      title: "Pieces that stay with you.",
    },
    featured_collections: {
      key: "featured_collections",
      section: "featured_collections",
      eyebrow: "Collections",
      title: "Women. Men. Bridal.",
      subtitle:
        "Three paths into MKOS — Ready-to-Wear and custom for women, contemporary menswear, and bridal celebrations.",
    },
    carousel: {
      key: "carousel",
      section: "carousel",
      eyebrow: "Lookbook",
      title: "Move through the house.",
      subtitle: "Scroll through the season — women, men, and statement pieces.",
    },
    categories: {
      key: "categories",
      section: "categories",
      eyebrow: "Shop by",
      title: "Find your kind of style.",
      subtitle: "Ready-to-Wear, Aso Ebi, Custom, Men, and Bridal.",
    },
    reviews: {
      key: "reviews",
      section: "reviews",
      eyebrow: "Client Voices",
      title: "Worn with confidence.",
    },
    instagram: {
      key: "instagram",
      section: "instagram",
      eyebrow: "@shopmykindofstyle",
      title: "Life in the edit.",
      subtitle: "Follow MKOS and MKoS Men on Instagram.",
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
      body: "MKOS · MY KIND OF STYLE · FOR THOSE WHO UNDERSTAND STYLE · MKoS MASTER STANDARD · ",
    },
    shop: {
      key: "shop",
      section: "shop",
      eyebrow: "Shop",
      title: "The full collection.",
      subtitle: "Women, men, and bridal — filter by collection or category. Pricing coming via admin.",
    },
  };

  return {
    settings: {
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
    })),
    reviews: fallbackReviews,
    faqs: fallbackFaqs,
    content,
    navigation: [
      { label: "Home", href: "/", location: "header" },
      { label: "Shop", href: "/shop", location: "header" },
      { label: "Women", href: "/shop?collection=women", location: "header" },
      { label: "Men", href: "/shop?collection=men", location: "header" },
      { label: "Story", href: "/about", location: "header" },
      { label: "Experience", href: "/experience", location: "header" },
      { label: "Journal", href: "/blog", location: "header" },
      { label: "Account", href: "/account", location: "header" },
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
      supabase.from("products").select("*").eq("is_published", true).order("sort_order"),
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

    const settings: SiteSettings = settingsRes.data
      ? {
          brand_name: settingsRes.data.brand_name,
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

    const categories: Category[] =
      categoriesRes.data?.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        image_url: c.image_url,
      })) ?? fallback.categories;

    const collections: Collection[] =
      collectionsRes.data?.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        image: c.image_url ?? "",
        video: c.video_url ?? undefined,
      })) ?? fallback.collections;

    const reviews: Review[] =
      reviewsRes.data?.map((r) => ({
        id: r.id,
        name: r.author_name,
        location: r.location ?? "",
        rating: r.rating,
        text: r.body,
        product: r.product_name ?? "",
      })) ?? fallback.reviews;

    const faqs: Faq[] =
      faqsRes.data?.map((f) => ({
        id: f.id,
        q: f.question,
        a: f.answer,
      })) ?? fallback.faqs;

    const navigation: NavLink[] = (() => {
      const fromDb =
        navRes.data?.map((n) => ({
          label: n.label,
          href: n.href,
          location: n.location,
        })) ?? null;
      if (!fromDb?.length) return fallback.navigation;
      const hasExperience = fromDb.some((n) => n.href === "/experience");
      if (hasExperience) return fromDb;
      const storyIdx = fromDb.findIndex((n) => n.href === "/about");
      const insertAt = storyIdx >= 0 ? storyIdx + 1 : Math.min(4, fromDb.length);
      return [
        ...fromDb.slice(0, insertAt),
        { label: "Experience", href: "/experience", location: "header" },
        ...fromDb.slice(insertAt),
      ];
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
const getCachedCmsSnapshot = unstable_cache(loadCmsSnapshot, ["cms-snapshot-v1"], {
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
