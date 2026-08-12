import { randomBytes, randomUUID } from "crypto";

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

export function flutterwaveConfigured() {
  return Boolean(flutterwaveClientId() && flutterwaveClientSecret());
}

export function flutterwaveBaseUrl() {
  const explicit = cleanEnv(process.env.FLUTTERWAVE_BASE_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  const env = cleanEnv(process.env.FLUTTERWAVE_ENV).toLowerCase();
  if (env === "live" || env === "production") {
    return "https://f4bexperience.flutterwave.com";
  }
  return "https://developersandbox-api.flutterwave.com";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function flutterwaveAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 15_000) {
    return cachedToken.token;
  }

  const clientId = flutterwaveClientId();
  const clientSecret = flutterwaveClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Flutterwave is not configured. Add FLUTTERWAVE_CLIENT_ID and FLUTTERWAVE_CLIENT_SECRET.");
  }

  const res = await fetch(
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    }
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `Flutterwave auth failed (${res.status})`
    );
  }

  const ttlMs = Math.max(30, Number(data.expires_in || 600) - 30) * 1000;
  cachedToken = { token: data.access_token, expiresAt: now + ttlMs };
  return data.access_token;
}

async function flwFetch<T>(
  path: string,
  init: RequestInit & { idempotency?: boolean } = {}
): Promise<T> {
  const token = await flutterwaveAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  headers.set("X-Trace-Id", randomUUID());
  if (init.idempotency !== false && (init.method || "GET").toUpperCase() !== "GET") {
    headers.set("X-Idempotency-Key", randomUUID());
  }
  const { idempotency: _i, ...rest } = init;
  const res = await fetch(`${flutterwaveBaseUrl()}${path}`, { ...rest, headers });
  const data = (await res.json().catch(() => ({}))) as T & {
    status?: string;
    message?: string;
    error?: {
      message?: string;
      validation_errors?: { field_name?: string; message?: string }[];
    };
  };
  if (!res.ok) {
    const details = data.error?.validation_errors
      ?.map((v) => `${v.field_name}: ${v.message}`)
      .filter(Boolean)
      .join("; ");
    throw new Error(
      [data.error?.message, details, data.message, `Flutterwave ${path} failed (${res.status})`]
        .filter(Boolean)
        .join(" — ")
    );
  }
  return data;
}

export type FlutterwaveCustomer = {
  id: string;
  email?: string;
};

export async function flutterwaveCreateCustomer(opts: {
  email: string;
  first: string;
  last: string;
  phone?: string;
}) {
  const phone = parsePhone(opts.phone);
  const body: Record<string, unknown> = {
    email: opts.email,
    name: {
      first: opts.first || "Client",
      last: opts.last || "MKoS",
    },
  };
  if (phone) body.phone = phone;

  try {
    const res = await flwFetch<{ data: FlutterwaveCustomer }>("/customers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/conflict|already|exist/i.test(message)) throw err;
    const lookup = await flwFetch<{ data?: FlutterwaveCustomer | FlutterwaveCustomer[] }>(
      `/customers?email=${encodeURIComponent(opts.email)}`,
      { method: "GET", idempotency: false }
    );
    const found = Array.isArray(lookup.data) ? lookup.data[0] : lookup.data;
    if (found?.id) return found;
    throw err;
  }
}

export type FlutterwaveCheckoutSession = {
  id: string;
  amount?: number;
  currency?: string;
  customer_id?: string;
  checkout_url?: string;
  redirect_url?: string;
  reference?: string;
  status?: string;
};

export async function flutterwaveCreateCheckoutSession(opts: {
  amountUsd: number;
  reference: string;
  customerId: string;
  redirectUrl: string;
}) {
  const res = await flwFetch<{ data: FlutterwaveCheckoutSession }>("/checkout/sessions", {
    method: "POST",
    body: JSON.stringify({
      amount: Number(opts.amountUsd.toFixed(2)),
      currency: "USD",
      customer_id: opts.customerId,
      redirect_url: opts.redirectUrl,
      reference: opts.reference,
      session_duration: 60,
    }),
  });
  const created = normalizeCheckoutSession(res.data);
  if (isUsableHostedCheckoutUrl(created.checkout_url)) return created;
  let merged = created;
  if (created.id) {
    try {
      const fetched = await flutterwaveGetCheckoutSession(created.id);
      merged = normalizeCheckoutSession({ ...created, ...fetched });
    } catch {
      /* retrieve is best-effort */
    }
  }
  if (!isUsableHostedCheckoutUrl(merged.checkout_url)) {
    merged.checkout_url = undefined;
  }
  return merged;
}

/** Flutterwave's sandbox hosted UI sits behind Azure Front Door and currently 504s. */
export function isUsableHostedCheckoutUrl(url?: string | null) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host.includes("developer-sandbox-ui-sit.flutterwave.cloud")) return false;
    return true;
  } catch {
    return false;
  }
}

export function flutterwaveIsSandbox() {
  return flutterwaveBaseUrl().includes("developersandbox");
}

function encryptionKeyBytes() {
  const raw = flutterwaveEncryptionKey();
  if (!raw) throw new Error("Flutterwave encryption key is not configured.");
  // Flutterwave docs: Base64-decode the dashboard Encryption Key into a 32-byte AES key.
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error(
      `Flutterwave encryption key must Base64-decode to 32 bytes (got ${decoded.length}). Re-copy Encryption Key from the dashboard and quote it in .env.local.`
    );
  }
  return new Uint8Array(decoded);
}

/** Same algorithm as Flutterwave's documented encryptAES helper. */
export async function flutterwaveEncryptField(plain: string, nonce: string) {
  if (nonce.length !== 12) throw new Error("Encryption nonce must be 12 characters.");
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Crypto API is not available in this environment.");
  const key = await subtle.importKey("raw", encryptionKeyBytes(), { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = await subtle.encrypt(
    { name: "AES-GCM", iv: new TextEncoder().encode(nonce) },
    key,
    new TextEncoder().encode(String(plain))
  );
  return Buffer.from(encrypted).toString("base64");
}

async function encryptCardPayload(opts: {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}) {
  const nonce = flutterwaveNonce();
  return {
    nonce,
    encrypted_card_number: await flutterwaveEncryptField(opts.cardNumber, nonce),
    encrypted_expiry_month: await flutterwaveEncryptField(opts.expiryMonth, nonce),
    encrypted_expiry_year: await flutterwaveEncryptField(opts.expiryYear, nonce),
    encrypted_cvv: await flutterwaveEncryptField(opts.cvv, nonce),
  };
}

export function flutterwaveNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(12);
  let nonce = "";
  for (const byte of bytes) nonce += chars[byte % chars.length];
  return nonce;
}

export async function flutterwaveCreateCardPaymentMethod(
  opts:
    | {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
      }
    | {
        nonce: string;
        encrypted_card_number: string;
        encrypted_expiry_month: string;
        encrypted_expiry_year: string;
        encrypted_cvv: string;
      }
) {
  const card =
    "encrypted_card_number" in opts
      ? {
          nonce: opts.nonce,
          encrypted_card_number: opts.encrypted_card_number,
          encrypted_expiry_month: opts.encrypted_expiry_month,
          encrypted_expiry_year: opts.encrypted_expiry_year,
          encrypted_cvv: opts.encrypted_cvv,
        }
      : await encryptCardPayload(opts);

  try {
    const res = await flwFetch<{ data: { id: string } }>("/payment-methods", {
      method: "POST",
      body: JSON.stringify({ type: "card", card }),
    });
    if (!res.data?.id) throw new Error("Could not save the card with Flutterwave.");
    return res.data.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Card encryption failed";
    if (/decrypt|encryption/i.test(message)) {
      throw new Error(
        "Flutterwave could not decrypt the card. Re-copy your Encryption Key from the Flutterwave dashboard into FLUTTERWAVE_ENCRYPTION_KEY (and NEXT_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY), keep it quoted, then restart the dev server."
      );
    }
    throw err instanceof Error ? err : new Error(message);
  }
}

export type FlutterwaveNextAction = {
  type?: string;
  authorization?: { type?: string };
  redirect_url?: { url?: string };
};

export type FlutterwaveCharge = {
  id: string;
  amount?: number;
  currency?: string;
  reference?: string;
  status?: string;
  next_action?: FlutterwaveNextAction;
};

export async function flutterwaveCreateCharge(opts: {
  amountUsd: number;
  reference: string;
  customerId: string;
  paymentMethodId: string;
  redirectUrl: string;
}) {
  const res = await flwFetch<{ data: FlutterwaveCharge }>("/charges", {
    method: "POST",
    body: JSON.stringify({
      amount: Number(opts.amountUsd.toFixed(2)),
      currency: "USD",
      reference: opts.reference,
      customer_id: opts.customerId,
      payment_method_id: opts.paymentMethodId,
      redirect_url: opts.redirectUrl,
    }),
  });
  return res.data;
}

export async function flutterwaveAuthorizeCharge(
  chargeId: string,
  authorization:
    | { type: "pin"; pin: string }
    | { type: "otp"; otp: string }
) {
  const nonce = flutterwaveNonce();
  const body =
    authorization.type === "pin"
      ? {
          authorization: {
            type: "pin",
            pin: {
              nonce,
              encrypted_pin: await flutterwaveEncryptField(authorization.pin, nonce),
            },
          },
        }
      : {
          authorization: {
            type: "otp",
            otp: {
              nonce,
              encrypted_otp: await flutterwaveEncryptField(authorization.otp, nonce),
            },
          },
        };
  const res = await flwFetch<{ data: FlutterwaveCharge }>(
    `/charges/${encodeURIComponent(chargeId)}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  return res.data;
}

function normalizeCheckoutSession(
  data: FlutterwaveCheckoutSession & { url?: string; link?: string }
): FlutterwaveCheckoutSession {
  return {
    ...data,
    checkout_url: data.checkout_url || data.url || data.link,
  };
}

export async function flutterwaveGetCheckoutSession(id: string) {
  const res = await flwFetch<{ data: FlutterwaveCheckoutSession }>(
    `/checkout/sessions/${encodeURIComponent(id)}`,
    { method: "GET", idempotency: false }
  );
  return res.data;
}

export async function flutterwaveGetCharge(id: string) {
  const res = await flwFetch<{ data: FlutterwaveCharge }>(
    `/charges/${encodeURIComponent(id)}`,
    { method: "GET", idempotency: false }
  );
  return res.data;
}

export async function flutterwaveFindChargeByReference(reference: string) {
  const res = await flwFetch<{ data?: FlutterwaveCharge | FlutterwaveCharge[] }>(
    `/charges?reference=${encodeURIComponent(reference)}`,
    { method: "GET", idempotency: false }
  );
  const data = res.data;
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export function flutterwavePaymentSucceeded(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return s === "succeeded" || s === "successful" || s === "completed" || s === "paid";
}

function parsePhone(raw?: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length >= 13) {
    return { country_code: "234", number: digits.slice(3) };
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return { country_code: "234", number: digits.slice(1) };
  }
  if (digits.length >= 10) {
    return { country_code: "234", number: digits };
  }
  return null;
}
