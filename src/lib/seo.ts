import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://mykindofstyle.com";

export const SITE_NAME = "MKoS";
export const SITE_TAGLINE = "For Those Who Understand STYLE";

export const DEFAULT_DESCRIPTION =
  "MKoS (My Kind of Style) is a Nigerian contemporary fashion house creating timeless Ready-to-Wear, bespoke, and couture for women and men — crafted in Oniru, Lagos.";

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
    brand: { "@type": "Brand", name: SITE_NAME },
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: usd != null ? "USD" : "NGN",
      price: usd != null ? usd.toFixed(2) : String(product.price ?? ""),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
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

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_NG",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: ogImages,
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}
