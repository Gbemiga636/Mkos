import { createServiceClient } from "@/lib/supabase/client";

export type PromoCode = {
  code: string;
  percent: number;
  active?: boolean;
};

const CONTENT_KEY = "checkout_promos";

function cleanCode(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function normalizePromos(raw: unknown): PromoCode[] {
  if (!Array.isArray(raw)) return [];
  const out: PromoCode[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const code = cleanCode(String((row as PromoCode).code || ""));
    const percent = Number((row as PromoCode).percent);
    if (!code || !Number.isFinite(percent) || percent <= 0 || percent > 90) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      percent: Math.round(percent * 100) / 100,
      active: (row as PromoCode).active !== false,
    });
  }
  return out;
}

export async function loadPromoCodes() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("site_content")
    .select("extra")
    .eq("key", CONTENT_KEY)
    .maybeSingle();
  const extra = (data?.extra || {}) as { codes?: unknown };
  return normalizePromos(extra.codes);
}

export async function savePromoCodes(codes: PromoCode[]) {
  const sb = createServiceClient();
  const cleaned = normalizePromos(codes);
  const { error } = await sb.from("site_content").upsert(
    {
      key: CONTENT_KEY,
      section: "checkout",
      extra: { codes: cleaned },
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);
  return cleaned;
}

export function findPromo(codes: PromoCode[], code: string) {
  const needle = cleanCode(code);
  if (!needle) return null;
  return codes.find((c) => c.active !== false && c.code === needle) || null;
}

export function applyPromoPercent(amount: number, percent: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return Number(amount.toFixed(2));
  const discount = amount * (percent / 100);
  return Number(Math.max(0, amount - discount).toFixed(2));
}
