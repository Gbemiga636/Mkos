import {
  categories as dataCategories,
  collections as dataCollections,
  RTW_CATEGORY_SLUGS,
} from "@/data/products";

/** Primary storefront collections — Ready-to-Wear, Bespoke, Bridal */
export const PRIMARY_COLLECTIONS = dataCollections.map((c) => ({
  slug: c.slug,
  name: c.name,
}));

/** Sub-offerings within Ready-to-Wear on the storefront */
export const OFFERING_CATEGORIES = dataCategories.map((c) => ({
  slug: c.slug,
  name: c.name,
}));

export { RTW_CATEGORY_SLUGS };

/** Category options in admin product forms (RTW + future Bespoke/Bridal tagging) */
export const ADMIN_PRODUCT_CATEGORIES = [
  { value: "women-rtw", label: "Women’s RTW" },
  { value: "men-rtw", label: "Men’s RTW" },
  { value: "boubou", label: "Boubou" },
  { value: "women-bespoke", label: "Women’s Bespoke" },
  { value: "men-bespoke", label: "Men’s Bespoke" },
  { value: "aso-ebi", label: "Aso Ebi" },
  { value: "occasion", label: "Occasion Wear" },
  { value: "registry-gowns", label: "Registry Gowns" },
  { value: "reception", label: "Reception Dresses" },
  { value: "bridesmaids", label: "Bridesmaids" },
  { value: "grooms", label: "Grooms" },
  { value: "bridal-party", label: "Family & Bridal Party" },
] as const;

export function slugifyTaxonomy(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
