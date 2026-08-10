/** Product image focal point (CSS object-position), percent 0–100. */

export type ImageFocus = { x: number; y: number };

export const DEFAULT_IMAGE_FOCUS: ImageFocus = { x: 50, y: 50 };

export type StoredProductImage = string | { url: string; x?: number; y?: number };

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function normalizeFocus(focus?: Partial<ImageFocus> | null): ImageFocus {
  return {
    x: clamp(Number(focus?.x ?? DEFAULT_IMAGE_FOCUS.x) || DEFAULT_IMAGE_FOCUS.x),
    y: clamp(Number(focus?.y ?? DEFAULT_IMAGE_FOCUS.y) || DEFAULT_IMAGE_FOCUS.y),
  };
}

export function objectPositionCss(focus?: Partial<ImageFocus> | null): string {
  const f = normalizeFocus(focus);
  return `${f.x}% ${f.y}%`;
}

/** Read DB/jsonb images into parallel url + focus arrays. */
export function parseProductImages(raw: unknown): { images: string[]; imageFocus: ImageFocus[] } {
  const list = Array.isArray(raw) ? raw : [];
  const images: string[] = [];
  const imageFocus: ImageFocus[] = [];

  for (const item of list) {
    if (typeof item === "string" && item.trim()) {
      images.push(item.trim());
      imageFocus.push({ ...DEFAULT_IMAGE_FOCUS });
      continue;
    }
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const url = String(row.url || row.src || "").trim();
      if (!url) continue;
      images.push(url);
      imageFocus.push(
        normalizeFocus({
          x: row.x != null ? Number(row.x) : undefined,
          y: row.y != null ? Number(row.y) : undefined,
        })
      );
    }
  }

  // Drop legacy duplicate .webp only when the same basename also exists as jpg/png/etc.
  // Do NOT drop all webps whenever any non-webp remains — admin uploads are always .webp.
  const basenameKey = (src: string) => {
    const path = src.split("?")[0].toLowerCase();
    const file = path.split("/").pop() || path;
    return file.replace(/\.(webp|jpe?g|png|gif|avif|heic)$/i, "");
  };
  const nonWebpBases = new Set(
    images
      .filter((src) => !src.toLowerCase().split("?")[0].endsWith(".webp"))
      .map(basenameKey)
      .filter(Boolean)
  );

  const seen = new Set<string>();
  const outImages: string[] = [];
  const outFocus: ImageFocus[] = [];
  for (let i = 0; i < images.length; i++) {
    const src = images[i];
    const isWebp = src.toLowerCase().split("?")[0].endsWith(".webp");
    if (isWebp && nonWebpBases.has(basenameKey(src))) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    outImages.push(src);
    outFocus.push(imageFocus[i]);
  }
  return { images: outImages, imageFocus: outFocus };
}

/** Serialize for products.images jsonb — plain string when centered, object when framed. */
export function serializeProductImages(
  images: string[],
  imageFocus?: ImageFocus[] | null
): StoredProductImage[] {
  return images.filter(Boolean).map((url, i) => {
    const focus = normalizeFocus(imageFocus?.[i]);
    if (focus.x === DEFAULT_IMAGE_FOCUS.x && focus.y === DEFAULT_IMAGE_FOCUS.y) {
      return url;
    }
    return { url, x: focus.x, y: focus.y };
  });
}
