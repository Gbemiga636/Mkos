import { ADMIN_EMAIL } from "@/lib/admin/auth";

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

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function paystackSecret() {
  return cleanEnv(process.env.PAYSTACK_SECRET_KEY);
}

export function paystackPublicKey() {
  return cleanEnv(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

export function orderNotifyEmail() {
  return process.env.ORDER_NOTIFY_EMAIL || ADMIN_EMAIL;
}

export function resendFrom() {
  return process.env.RESEND_FROM_EMAIL || "MKoS <hello@mykindofstyle.com>";
}

export type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    customer?: { email?: string };
    metadata?: Record<string, unknown>;
  };
};

export async function paystackInitialize(opts: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const secret = paystackSecret();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not set on the server");
  }
  if (!secret.startsWith("sk_")) {
    throw new Error("PAYSTACK_SECRET_KEY looks wrong — it must start with sk_test_ or sk_live_");
  }
  const amountKobo = Math.round(opts.amountNaira * 100);
  if (!Number.isFinite(amountKobo) || amountKobo < 100) {
    throw new Error("Order total is too low for Paystack (minimum ₦1.00)");
  }
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: amountKobo,
      currency: "NGN",
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata ?? {},
    }),
  });
  const data = (await res.json()) as PaystackInitResponse;
  if (!res.ok || !data.status || !data.data) {
    const msg = data.message || "Paystack initialize failed";
    if (/invalid.?key/i.test(msg)) {
      throw new Error(
        "Paystack rejected this secret key for payments. Open Paystack → Settings → API Keys & Webhooks, copy a fresh Secret Key (sk_test_…), update PAYSTACK_SECRET_KEY in Netlify (no quotes), then Clear cache and redeploy."
      );
    }
    throw new Error(msg);
  }
  return data.data;
}

export async function paystackVerify(reference: string) {
  const secret = paystackSecret();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    }
  );
  const data = (await res.json()) as PaystackVerifyResponse;
  if (!res.ok || !data.status || !data.data) {
    throw new Error(data.message || "Paystack verify failed");
  }
  return data.data;
}
