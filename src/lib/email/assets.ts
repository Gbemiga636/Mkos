import { siteUrl } from "@/lib/siteUrl";

function clean(value: string | undefined) {
  let v = (value || "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\/$/, "");
}

/**
 * Base URL for images embedded in transactional email.
 * Set EMAIL_ASSET_BASE_URL to your verified sending domain once DNS serves the site
 * (e.g. https://mykindofstyle.com). Until then, use the live Netlify URL.
 */
export function emailAssetBase() {
  const explicit = clean(process.env.EMAIL_ASSET_BASE_URL);
  if (explicit) return explicit;

  const site = clean(siteUrl());
  if (site && !/localhost|127\.0\.0\.1/i.test(site)) return site;

  const from = process.env.RESEND_FROM_EMAIL || "";
  const host = from.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.toLowerCase();
  if (host && host !== "resend.dev") {
    return `https://${host}`;
  }

  return "https://mykindofstyle.com";
}

/** Turn relative or localhost paths into absolute HTTPS URLs for email clients. */
export function emailAssetUrl(src?: string | null): string | null {
  if (!src) return null;
  const raw = String(src).trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        return `${emailAssetBase()}${u.pathname}${u.search}`;
      }
    } catch {
      /* keep as-is */
    }
    return raw;
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${emailAssetBase()}${path}`;
}

export const EMAIL_LOGO_PATH = "/logo/mkos-logo.png";
