export const PAY_REF_COOKIE = "mkos_pay_ref";

export function isMerchantReference(value?: string | null) {
  return /^mkos/i.test(String(value || "").trim());
}

/** v4 charge ids look like chg_… — never treat a bare numeric Flutterwave `id` as one. */
export function looksLikeChargeId(value?: string | null) {
  const v = String(value || "").trim();
  if (!v || /^\d+$/.test(v)) return false;
  return /^(chg_|chr_|ch_)/i.test(v);
}

export function pickMerchantReference(...candidates: (string | null | undefined)[]) {
  const cleaned = candidates.map((c) => String(c || "").trim()).filter(Boolean);
  return cleaned.find(isMerchantReference) || cleaned[0] || "";
}
