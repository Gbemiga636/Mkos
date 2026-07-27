import { categories as dataCategories, collections as dataCollections } from "@/data/products";

/** Primary storefront collections — Ready-to-Wear, Bespoke, Bridal */
export const PRIMARY_COLLECTIONS = dataCollections.map((c) => ({
  slug: c.slug,
  name: c.name,
}));

/** Sub-offerings within the primary collections */
export const OFFERING_CATEGORIES = dataCategories.map((c) => ({
  slug: c.slug,
  name: c.name,
}));

export function slugifyTaxonomy(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
