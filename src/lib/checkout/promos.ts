import { createServiceClient } from "@/lib/supabase/client";

export type PromoCode = {
  code: string;
  /** Flat amount taken off the total — same figure in every currency. */
  amountOff: number;
  /** Cart must contain at least this many pieces (sum of quantities). */
  minItems: number;
  active?: boolean;
};

const CONTENT_KEY = "checkout_promos";

function cleanCode(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function cartItemCount(items: { quantity?: number }[]) {
  return items.reduce((n, i) => n + Math.max(0, Math.floor(Number(i.quantity) || 0)), 0);
}

export function normalizePromos(raw: unknown): PromoCode[] {
  if (!Array.isArray(raw)) return [];
  const out: PromoCode[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const code = cleanCode(String(rec.code || ""));
    const amountOff = Number(rec.amountOff ?? rec.amountOff ?? rec.amount);
    const minItems = Math.max(1, Math.round(Number(rec.minItems ?? rec.minItems) || 1));
    if (!code || !Number.isFinite(amountOff) || amountOff <= 0) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      amountOff: Math.round(amountOff * 100) / 100,
      minItems,
      active: rec.active !== false,
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

export function applyPromoAmount(amount: number, amountOff: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(amountOff) || amountOff <= 0) return Number(amount.toFixed(2));
  return Number(Math.max(0, amount - amountOff).toFixed(2));
}

