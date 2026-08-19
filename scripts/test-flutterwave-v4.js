const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnv(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");

function nonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(12);
  let s = "";
  for (const b of bytes) s += chars[b % chars.length];
  return s;
}

async function encryptWeb(plain, n, keyBuf) {
  const key = await crypto.webcrypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv: Buffer.from(n, "utf8") },
    key,
    Buffer.from(String(plain), "utf8")
  );
  return Buffer.from(encrypted).toString("base64");
}

async function main() {
  const clientId = process.env.FLUTTERWAVE_CLIENT_ID;
  const clientSecret = process.env.FLUTTERWAVE_CLIENT_SECRET;
  const encKey = (process.env.FLUTTERWAVE_ENCRYPTION_KEY || "").replace(/^"|"$/g, "");
  if (!clientId || !clientSecret || !encKey) {
    console.error("missing_flutterwave_env");
    process.exit(1);
  }

  const tokenRes = await fetch(
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
  const tokenJson = await tokenRes.json();
  console.log(
    JSON.stringify({
      step: "auth",
      http: tokenRes.status,
      has_token: Boolean(tokenJson.access_token),
      expires_in: tokenJson.expires_in || null,
      error: tokenJson.error || tokenJson.error_description || null,
    })
  );
  if (!tokenJson.access_token) process.exit(2);

  const bases = [
    "https://developersandbox-api.flutterwave.com",
    "https://f4bexperience.flutterwave.com",
    "https://api.flutterwave.com/v4",
  ];
  let base = "";
  for (const candidate of bases) {
    const probe = await fetch(`${candidate}/customers?page=1`, {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "X-Trace-Id": `mkos-probe-${Date.now()}`,
      },
    });
    const body = await probe.json().catch(() => ({}));
    console.log(
      JSON.stringify({
        step: "base_probe",
        base: candidate,
        http: probe.status,
        message: body.message || body.error?.message || null,
      })
    );
    if (probe.ok) {
      base = candidate;
      break;
    }
  }
  if (!base) {
    console.error("no_working_api_base");
    process.exit(3);
  }
  console.log(JSON.stringify({ step: "selected_base", base }));

  const headers = {
    Authorization: `Bearer ${tokenJson.access_token}`,
    "Content-Type": "application/json",
    "X-Trace-Id": `mkos-v4-${Date.now()}`,
    "X-Idempotency-Key": `mkos-v4-${Date.now()}`,
  };

  const email = `v4.test.${Date.now()}@mykindofstyle.com`;
  const cusRes = await fetch(`${base}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      name: { first: "MKoS", last: "Test" },
      phone: { country_code: "234", number: "8012345678" },
    }),
  });
  const cus = await cusRes.json();
  const customerId = cus?.data?.id;
  console.log(
    JSON.stringify({
      step: "customer",
      http: cusRes.status,
      customer_id: customerId || null,
      message: cus?.message || cus?.error?.message || null,
    })
  );
  if (!customerId) process.exit(4);

  const keyBuf = Buffer.from(encKey, "base64");
  console.log(JSON.stringify({ step: "key_bytes", length: keyBuf.length }));
  if (keyBuf.length !== 32) {
    console.error("encryption_key_must_decode_to_32_bytes");
    process.exit(5);
  }

  const n = nonce();
  const card = {
    nonce: n,
    encrypted_card_number: await encryptWeb("5531886652142950", n, keyBuf),
    encrypted_expiry_month: await encryptWeb("09", n, keyBuf),
    encrypted_expiry_year: await encryptWeb("32", n, keyBuf),
    encrypted_cvv: await encryptWeb("564", n, keyBuf),
  };
  const pmRes = await fetch(`${base}/payment-methods`, {
    method: "POST",
    headers: { ...headers, "X-Idempotency-Key": `mkos-pm-${Date.now()}` },
    body: JSON.stringify({ type: "card", card }),
  });
  const pm = await pmRes.json();
  console.log(
    JSON.stringify({
      step: "payment_method",
      http: pmRes.status,
      id: pm?.data?.id || null,
      brand: pm?.data?.card?.network || null,
      last4: pm?.data?.card?.last4 || null,
      message: pm?.message || pm?.error?.message || null,
    })
  );
  if (!pm?.data?.id) process.exit(6);

  if (!base.includes("sandbox")) {
    console.log(
      JSON.stringify({
        step: "charge",
        skipped: true,
        reason: "Live keys — not placing a real $1 charge with a test PAN",
      })
    );
    return;
  }

  const ref = `mkosfw${Date.now().toString(36)}v4`;
  const chRes = await fetch(`${base}/charges`, {
    method: "POST",
    headers: { ...headers, "X-Idempotency-Key": `mkos-pay-${Date.now()}` },
    body: JSON.stringify({
      amount: 1.0,
      currency: "USD",
      reference: ref,
      customer_id: customerId,
      payment_method_id: pm.data.id,
      redirect_url: "http://localhost:3000/checkout/success",
    }),
  });
  const ch = await chRes.json();
  const d = ch?.data || {};
  console.log(
    JSON.stringify({
      step: "charge",
      http: chRes.status,
      id: d.id || null,
      status: d.status || ch.status || null,
      next_action: d.next_action?.type || null,
      auth_type: d.next_action?.authorization?.type || null,
      message: ch?.message || ch?.error?.message || null,
    })
  );
}

main().catch((err) => {
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
});
