/** Client-safe site URL helpers — no server-only imports. */

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
