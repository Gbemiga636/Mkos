/** Flutterwave v3 (Standard hosted checkout) helpers. */

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

const FLW_V3_BASE = "https://api.flutterwave.com/v3";

export function flutterwaveV3Secret() {
  return cleanEnv(process.env.FLUTTERWAVE_SECRET_KEY);
}

export function flutterwaveV3PublicKey() {
  return cleanEnv(process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY);
}

/** Secret hash configured in the Flutterwave dashboard for webhook verification. */
export function flutterwaveV3WebhookHash() {
  return cleanEnv(process.env.FLUTTERWAVE_WEBHOOK_SECRET);
}

export function flutterwaveV3Configured() {
  return Boolean(flutterwaveV3Secret());
}

export function flutterwaveV3Succeeded(status?: string | null) {
  return String(status || "").toLowerCase() === "successful";
}

type FlutterwaveV3Response<T> = {
  status?: string;
  message?: string;
  data?: T;
};

export type FlutterwaveV3Payment = {
  id?: number | string;
  tx_ref?: string;
  flw_ref?: string;
  amount?: number;
  charged_amount?: number;
  currency?: string;
  status?: string;
  customer?: { email?: string; name?: string; phone_number?: string };
};

export async function flutterwaveV3Initialize(opts: {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email: string; name: string; phonenumber?: string };
  title?: string;
  logo?: string;
  meta?: Record<string, unknown>;
}) {
  const secret = flutterwaveV3Secret();
  if (!secret) {
    throw new Error(
      "Flutterwave is not configured. Add FLUTTERWAVE_SECRET_KEY to the server environment."
    );
  }

  const res = await fetch(`${FLW_V3_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: Number(opts.amount.toFixed(2)),
      currency: opts.currency,
      redirect_url: opts.redirectUrl,
      payment_options: "card, banktransfer, ussd, account, mobilemoney",
      customer: {
        email: opts.customer.email,
        name: opts.customer.name,
        phonenumber: opts.customer.phonenumber || undefined,
      },
      customizations: {
        title: opts.title || "My Kind of Style",
        logo: opts.logo || undefined,
      },
      meta: opts.meta || undefined,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as FlutterwaveV3Response<{
    link?: string;
  }>;

  if (!res.ok || json.status !== "success" || !json.data?.link) {
    throw new Error(json.message || `Flutterwave initialize failed (${res.status})`);
  }

  return { link: json.data.link };
}

export async function flutterwaveV3Verify(transactionId: string | number) {
  const secret = flutterwaveV3Secret();
  if (!secret) {
    throw new Error("Flutterwave is not configured.");
  }
  const res = await fetch(
    `${FLW_V3_BASE}/transactions/${encodeURIComponent(String(transactionId))}/verify`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    }
  );
  const json = (await res.json().catch(() => ({}))) as FlutterwaveV3Response<FlutterwaveV3Payment>;
  if (!res.ok || !json.data) {
    throw new Error(json.message || `Flutterwave verify failed (${res.status})`);
  }
  return json.data;
}

/** Look up a transaction by your tx_ref (used when only the reference is known). */
export async function flutterwaveV3VerifyByReference(txRef: string) {
  const secret = flutterwaveV3Secret();
  if (!secret) throw new Error("Flutterwave is not configured.");
  const res = await fetch(
    `${FLW_V3_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    }
  );
  const json = (await res.json().catch(() => ({}))) as FlutterwaveV3Response<FlutterwaveV3Payment>;
  if (!res.ok || !json.data) return null;
  return json.data;
}
