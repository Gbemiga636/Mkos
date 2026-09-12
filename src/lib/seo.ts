import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://mykindofstyle.com";

/** Short brand mark used in UI and compact titles */
export const SITE_NAME = "MKoS";

/** Full brand name — primary for Google brand search */
export const SITE_FULL_NAME = "My Kind of Style";

export const SITE_TAGLINE = "For Those Who Understand STYLE";

export const DEFAULT_DESCRIPTION =
  "My Kind of Style (MKoS) is a Nigerian contemporary fashion house creating timeless Ready-to-Wear, bespoke, and couture for women and men — crafted in Oniru, Lagos. Shop My Kind of Style online.";

/** Default browser / Google search result title */
export const DEFAULT_TITLE = `My Kind of Style (MKoS) — ${SITE_TAGLINE}`;

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Shared Open Graph / Twitter defaults for public pages. */
export function productJsonLd(product: {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  images?: string[];
  priceUsd?: number;
  price?: number;
  stock?: number;
  sku?: string;
}) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const images = (product.images || []).slice(0, 6).map((src) =>
    src.startsWith("http") ? src : absoluteUrl(src)
  );
  const usd = product.priceUsd != null && product.priceUsd > 0 ? product.priceUsd : null;
  const inStock = (product.stock ?? 1) > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || product.description || product.name,
    image: images,
    sku: product.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_FULL_NAME,
      alternateName: SITE_NAME,
    },
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: usd != null ? "USD" : "NGN",
      price: usd != null ? usd.toFixed(2) : String(product.price ?? ""),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_FULL_NAME },
    },
  };
}

export function pageMetadata({
  title,
  description,
  path = "/",
  images,
  noIndex,
}: {
  title: string;
  description: string;
  path?: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImages = (images?.length ? images : ["/logo/mkos-logo.png"]).map((src) =>
    src.startsWith("http") ? src : absoluteUrl(src)
  );
  const fullTitle = title.includes("My Kind of Style")
    ? title
    : `${title} · My Kind of Style (MKoS)`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_FULL_NAME,
      locale: "en_NG",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImages,
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}
