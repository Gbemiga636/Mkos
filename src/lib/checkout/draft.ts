import type { DeliveryMethod } from "@/lib/checkout/delivery";
import { PAY_REF_COOKIE } from "@/lib/checkout/payRef";

export const CHECKOUT_DRAFT_KEY = "mkos-checkout-draft-v1";

export type CheckoutDraft = {
  email: string;
  first: string;
  last: string;
  phone: string;
  phoneDial: string;
  phoneNational: string;
  deliveryMethod: "" | DeliveryMethod;
  expectedDeliveryDate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  reference?: string;
  customerId?: string;
  chargeId?: string;
  amountUsd?: number;
  savedAt: number;
};

function writeStores(payload: CheckoutDraft) {
  const raw = JSON.stringify(payload);
  try {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, raw);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, raw);
  } catch {
    /* ignore */
  }
}

function readStore(storage: Storage | undefined): CheckoutDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutDraft;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      storage.removeItem(CHECKOUT_DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistPayReference(reference: string, chargeId?: string) {
  if (typeof window === "undefined" || !reference) return;
  const existing = loadCheckoutDraft();
  const next: CheckoutDraft = {
    email: existing?.email || "",
    first: existing?.first || "",
    last: existing?.last || "",
    phone: existing?.phone || "",
    phoneDial: existing?.phoneDial || "",
    phoneNational: existing?.phoneNational || "",
    deliveryMethod: existing?.deliveryMethod || "",
    expectedDeliveryDate: existing?.expectedDeliveryDate || "",
    address: existing?.address || "",
    city: existing?.city || "",
    state: existing?.state || "",
    zip: existing?.zip || "",
    country: existing?.country || "",
    ...existing,
    reference,
    chargeId: chargeId || existing?.chargeId,
    savedAt: Date.now(),
  };
  writeStores(next);
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${PAY_REF_COOKIE}=${encodeURIComponent(reference)}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

export function readPayCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${PAY_REF_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export function saveCheckoutDraft(draft: Omit<CheckoutDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: CheckoutDraft = { ...draft, savedAt: Date.now() };
  writeStores(payload);
  if (payload.reference) persistPayReference(payload.reference, payload.chargeId);
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  return readStore(window.sessionStorage) || readStore(window.localStorage);
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${PAY_REF_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}
