/** Pick the gallery image that belongs to a chosen colour. */

function norm(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const COLOR_HINTS: Record<string, string[]> = {
  orange: ["orange", "rust", "terracotta", "coral"],
  blue: ["blue", "navy", "indigo", "cobalt"],
  tan: ["tan", "beige", "khaki", "camel", "sand", "nude"],
  black: ["black"],
  white: ["white", "ivory", "cream"],
  brown: ["brown", "chocolate"],
  green: ["green", "olive"],
  red: ["red", "burgundy", "wine"],
  pink: ["pink", "blush"],
  gold: ["gold"],
  yellow: ["yellow", "mustard"],
};

/** Known gallery order when the first photo is colour A and the next is colour B. */
const SLUG_GALLERY_COLORS: { match: (slug: string) => boolean; colors: string[] }[] = [
  { match: (s) => s.includes("akanni"), colors: ["blue", "orange"] },
  {
    match: (s) => s.includes("doja-pants") && (s.includes("men") || s.includes("male")),
    colors: ["tan", "blue"],
  },
  {
    match: (s) => s.includes("doja-skirt") && !s.endsWith("-blue") && !s.endsWith("-tan"),
    colors: ["blue", "tan"],
  },
];

function colorTokens(colorName: string) {
  const n = norm(colorName);
  if (!n) return [];
  const parts = n.split(" ").filter(Boolean);
  const hints = COLOR_HINTS[parts[0]] || [];
  return [...new Set([n, n.replace(/\s/g, ""), ...parts, ...hints])].filter((t) => t.length >= 3);
}

function fileMatchesColor(src: string, colorName: string) {
  let file = "";
  try {
    file = decodeURIComponent(src).toLowerCase();
  } catch {
    file = String(src || "").toLowerCase();
  }
  return colorTokens(colorName).some((t) => file.includes(t));
}

function colorsClose(a: string, b: string) {
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const tokensA = colorTokens(a);
  const tokensB = colorTokens(b);
  return tokensA.some((t) => tokensB.includes(t));
}

/**
 * Returns the image URL (and index) for a selected colour.
 * 1) filename contains the colour name
 * 2) known product gallery order (Akanni, Doja pants men, Doja skirt)
 * 3) colour index in the product’s colour list
 * 4) first image
 */
export function imageForColor(
  images: string[] | undefined,
  colors: { name: string }[] | undefined,
  selectedColor?: string | null,
  slug?: string
) {
  const gallery = (images || []).filter(Boolean);
  const fallback = gallery[0] || "";
  if (!gallery.length) return { src: fallback, index: 0 };
  const chosen = String(selectedColor || "").trim();
  if (!chosen) return { src: fallback, index: 0 };

  const byFile = gallery.findIndex((src) => fileMatchesColor(src, chosen));
  if (byFile >= 0) return { src: gallery[byFile], index: byFile };

  const slugKey = String(slug || "").toLowerCase();
  const known = SLUG_GALLERY_COLORS.find((row) => row.match(slugKey));
  if (known) {
    const knownIndex = known.colors.findIndex((c) => colorsClose(c, chosen));
    if (knownIndex >= 0 && gallery[knownIndex]) {
      return { src: gallery[knownIndex], index: knownIndex };
    }
  }

  const list = colors || [];
  const colorIndex = list.findIndex((c) => colorsClose(c.name, chosen));
  if (colorIndex >= 0 && gallery[colorIndex]) {
    return { src: gallery[colorIndex], index: colorIndex };
  }

  return { src: fallback, index: 0 };
}
