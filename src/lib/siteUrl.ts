/** Client-safe site URL helpers — no server-only imports. */

const CANONICAL_SITE = "https://mykindofstyle.com";

export function siteUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  // 3-D Secure must return to the shop domain. A Netlify URL here drops
  // the checkout draft and makes the success page look like a failed payment.
  if (/netlify\.app$/i.test(raw) || /mkosv1\.netlify\.app/i.test(raw)) {
    return CANONICAL_SITE;
  }
  return raw;
}
