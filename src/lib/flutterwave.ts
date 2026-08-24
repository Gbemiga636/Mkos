/** Flutterwave v4 (OAuth + customers, payment methods, charges, webhooks). */

import { createHmac, randomBytes, randomUUID } from "crypto";

function cleanEnv(value: string | undefined) {
  let v = (value || "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

const TOKEN_URL =
  "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";

const SANDBOX_BASE = "https://developersandbox-api.flutterwave.com";
const LIVE_BASE = "https://f4bexperience.flutterwave.com";

export function flutterwaveClientId() {
  return cleanEnv(process.env.FLUTTERWAVE_CLIENT_ID);
}

export function flutterwaveClientSecret() {
  return cleanEnv(process.env.FLUTTERWAVE_CLIENT_SECRET);
}

export function flutterwaveEncryptionKey() {
  return cleanEnv(process.env.FLUTTERWAVE_ENCRYPTION_KEY);
}

export function flutterwaveWebhookSecret() {
  return cleanEnv(process.env.FLUTTERWAVE_WEBHOOK_SECRET);
}

export function flutterwaveEnv() {
  const v = cleanEnv(process.env.FLUTTERWAVE_ENV).toLowerCase();
  if (v === "live" || v === "production" || v === "prod") return "live";
  return "sandbox";
}

export function flutterwaveApiBase() {
  return flutterwaveEnv() === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function flutterwaveConfigured() {
  return Boolean(flutterwaveClientId() && flutterwaveClientSecret());
}

export function flutterwaveSucceeded(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return (
    s === "succeeded" ||
    s === "successful" ||
    s === "success" ||
    s === "completed" ||
    s === "complete" ||
    s === "paid" ||
    s === "approved"
  );
}

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export async function flutterwaveAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 15_000) {
    return tokenCache.token;
  }
  const clientId = flutterwaveClientId();
  const clientSecret = flutterwaveClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Flutterwave is not configured. Add FLUTTERWAVE_CLIENT_ID and FLUTTERWAVE_CLIENT_SECRET."
    );
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || `Flutterwave auth failed (${res.status})`
    );
  }
  const ttl = Number(json.expires_in || 600) * 1000;
  tokenCache = { token: json.access_token, expiresAt: Date.now() + ttl };
  return json.access_token;
}

function flwError(json: unknown, status: number, fallback: string) {
  const obj = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const err = obj.error && typeof obj.error === "object" ? (obj.error as Record<string, unknown>) : {};
  const message =
    (typeof err.message === "string" && err.message) ||
    (typeof obj.message === "string" && obj.message) ||
    fallback;
  if (/irregular transaction patterns/i.test(message)) {
    return "Flutterwave has paused this payment while they review the account. This is a Flutterwave compliance hold — not a problem with the card form. Email hi@flutterwavego.com or open a ticket from your Flutterwave dashboard.";
  }
  return `${message}${status ? ` (${status})` : ""}`;
}

async function flwFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; idempotency?: boolean } = {}
) {
  const token = await flutterwaveAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Trace-Id": randomUUID(),
  };
  if (opts.idempotency !== false && opts.method && opts.method !== "GET") {
    headers["X-Idempotency-Key"] = randomUUID();
  }
  const res = await fetch(`${flutterwaveApiBase()}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & {
    status?: string;
    message?: string;
    error?: { message?: string };
    data?: unknown;
  };
  return { res, json };
}

export type FlutterwaveCustomer = {
  id?: string;
  email?: string;
};

export async function flutterwaveCreateCustomer(opts: {
  email: string;
  first: string;
  last: string;
  phone?: { country_code: string; number: string };
  address?: {
    city?: string;
    country?: string;
    line1?: string;
    postal_code?: string;
    state?: string;
  };
}) {
  const body: Record<string, unknown> = {
    email: opts.email,
    name: { first: opts.first, last: opts.last },
  };
  if (opts.phone?.country_code && opts.phone.number) {
    body.phone = {
      country_code: opts.phone.country_code,
      number: opts.phone.number,
    };
  }
  if (opts.address?.line1 || opts.address?.city || opts.address?.country) {
    body.address = {
      city: opts.address.city || undefined,
      country: opts.address.country || undefined,
      line1: opts.address.line1 || undefined,
      postal_code: opts.address.postal_code || undefined,
      state: opts.address.state || undefined,
    };
  }

  const { res, json } = await flwFetch<{ data?: FlutterwaveCustomer }>(
    "/customers",
    { method: "POST", body }
  );
  const id = json.data?.id;
  if (res.ok && id) return json.data as FlutterwaveCustomer;

  const look = await flutterwaveFindCustomer(opts.email);
  if (look?.id) return look;

  throw new Error(flwError(json, res.status, "Could not create Flutterwave customer"));
}

export async function flutterwaveFindCustomer(email: string) {
  const { res, json } = await flwFetch<{ data?: FlutterwaveCustomer | FlutterwaveCustomer[] }>(
    `/customers?email=${encodeURIComponent(email)}`,
    { method: "GET", idempotency: false }
  );
  if (!res.ok) return null;
  const data = json.data;
  if (Array.isArray(data)) return data[0] || null;
  if (data && typeof data === "object" && data.id) return data;
  return null;
}

export type EncryptedCard = {
  nonce: string;
  encrypted_card_number: string;
  encrypted_expiry_month: string;
  encrypted_expiry_year: string;
  encrypted_cvv: string;
};

export async function flutterwaveCreatePaymentMethod(card: EncryptedCard) {
  const { res, json } = await flwFetch<{ data?: { id?: string } }>("/payment-methods", {
    method: "POST",
    body: { type: "card", card },
  });
  const id = json.data?.id;
  if (!res.ok || !id) {
    throw new Error(flwError(json, res.status, "Flutterwave /payment-methods failed"));
  }
  return { id };
}

/** Apple Pay payment method — Flutterwave then returns a redirect to their Apple Pay sheet. */
export async function flutterwaveCreateApplePayMethod(cardHolderName: string) {
  const name = cardHolderName.trim() || "Customer";
  const { res, json } = await flwFetch<{ data?: { id?: string } }>("/payment-methods", {
    method: "POST",
    body: {
      type: "applepay",
      applepay: { card_holder_name: name },
    },
  });
  const id = json.data?.id;
  if (!res.ok || !id) {
    throw new Error(flwError(json, res.status, "Could not start Apple Pay"));
  }
  return { id };
}

export type FlutterwaveNextAction = {
  type?: string;
  authorization?: { type?: string };
  redirect_url?: { url?: string };
  requires_pin?: unknown;
  requires_otp?: unknown;
};

export type FlutterwaveCharge = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  next_action?: FlutterwaveNextAction | null;
  customer?: { id?: string } | string;
};

export function flutterwaveNextActionType(charge?: FlutterwaveCharge | null) {
  const na = charge?.next_action;
  if (!na) return "";
  const t = String(na.type || "").toLowerCase();
  if (t === "authorize") return String(na.authorization?.type || "").toLowerCase();
  if (t === "redirect_url" || t === "redirect") return "redirect";
  return t.replace(/^requires_/, "");
}

export function flutterwaveRedirectUrl(charge?: FlutterwaveCharge | null) {
  const na = charge?.next_action;
  if (!na) return "";
  if (na.redirect_url?.url) return na.redirect_url.url;
  const extra = na as { url?: string; redirect?: { url?: string } };
  return extra.url || extra.redirect?.url || "";
}

export async function flutterwaveCreateCharge(opts: {
  reference: string;
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  redirectUrl: string;
  meta?: Record<string, unknown>;
}) {
  const { res, json } = await flwFetch<{ data?: FlutterwaveCharge }>("/charges", {
    method: "POST",
    body: {
      reference: opts.reference,
      amount: Number(opts.amount.toFixed(2)),
      currency: opts.currency,
      customer_id: opts.customerId,
      payment_method_id: opts.paymentMethodId,
      redirect_url: opts.redirectUrl,
      meta: opts.meta || undefined,
    },
  });
  if (!json.data?.id && !res.ok) {
    throw new Error(flwError(json, res.status, "Flutterwave charge failed"));
  }
  if (!json.data?.id) {
    throw new Error(flwError(json, res.status, "Flutterwave charge failed"));
  }
  return json.data;
}

export async function flutterwaveAuthorizeCharge(
  chargeId: string,
  authorization: Record<string, unknown>
) {
  const { res, json } = await flwFetch<{ data?: FlutterwaveCharge }>(
    `/charges/${encodeURIComponent(chargeId)}`,
    { method: "PUT", body: { authorization } }
  );
  if (!json.data) {
    throw new Error(flwError(json, res.status, "Flutterwave authorization failed"));
  }
  return json.data;
}

export async function flutterwaveGetCharge(chargeId: string) {
  const { res, json } = await flwFetch<{ data?: FlutterwaveCharge }>(
    `/charges/${encodeURIComponent(chargeId)}`,
    { method: "GET", idempotency: false }
  );
  if (!res.ok || !json.data) {
    throw new Error(flwError(json, res.status, "Flutterwave verify failed"));
  }
  return json.data;
}

function pickCharge(list: FlutterwaveCharge[]) {
  return list.find((c) => flutterwaveSucceeded(c.status)) || list[0] || null;
}

function chargesFromListPayload(data: unknown): FlutterwaveCharge[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as FlutterwaveCharge[];
  if (Array.isArray(obj.data)) return obj.data as FlutterwaveCharge[];
  if (typeof obj.id === "string" || typeof obj.status === "string") {
    return [data as FlutterwaveCharge];
  }
  return [];
}

export async function flutterwaveGetChargeByReference(reference: string) {
  const paths = [
    `/charges?reference=${encodeURIComponent(reference)}`,
    `/charges?tx_ref=${encodeURIComponent(reference)}`,
  ];
  for (const path of paths) {
    const { res, json } = await flwFetch<{ data?: unknown }>(path, {
      method: "GET",
      idempotency: false,
    });
    if (!res.ok) continue;
    const found = pickCharge(chargesFromListPayload(json.data));
    if (found) return found;
  }
  return null;
}

export function flutterwaveWebhookValid(rawBody: string, signature: string | null, hmac: string | null) {
  const secret = flutterwaveWebhookSecret();
  if (!secret) return true;
  const provided = (hmac || signature || "").trim();
  if (!provided) return false;
  if (provided === secret) return true;
  const b64 = createHmac("sha256", secret).update(rawBody).digest("base64");
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return provided === b64 || provided === hex;
}

export function isChargeFinishedEvent(type?: string | null) {
  const t = String(type || "").toLowerCase();
  if (!t.includes("charge")) return false;
  return t.includes("complet") || t.includes("success") || t.includes("success");
}

export function randomNonce(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
