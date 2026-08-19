import type { DeliveryMethod } from "@/lib/checkout/delivery";

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
  amountUsd?: number;
  savedAt: number;
};

export function saveCheckoutDraft(draft: Omit<CheckoutDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: CheckoutDraft = { ...draft, savedAt: Date.now() };
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutDraft;
    // Expire after 24h
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
