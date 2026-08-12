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

function encryptWithKey(plain, n, keyBuf) {
  const iv = Buffer.from(n, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuf, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([enc, tag]).toString("base64");
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
  const encKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
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
  console.log(JSON.stringify({ step: "auth", http: tokenRes.status, has_token: Boolean(tokenJson.access_token) }));
  if (!tokenJson.access_token) process.exit(2);

  const headers = {
    Authorization: `Bearer ${tokenJson.access_token}`,
    "Content-Type": "application/json",
    "X-Trace-Id": `mkos-chg-${Date.now()}`,
    "X-Idempotency-Key": `mkos-chg-${Date.now()}`,
  };

  const email = "checkout.test@mykindofstyle.com";
  const lookRes = await fetch(
    `https://developersandbox-api.flutterwave.com/customers?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: headers.Authorization, "X-Trace-Id": `mkos-look-${Date.now()}` } }
  );
  const look = await lookRes.json();
  const found = Array.isArray(look?.data) ? look.data[0] : look?.data;
  const customerId = found?.id;
  console.log(JSON.stringify({ step: "customer", http: lookRes.status, customer_id: customerId || null }));
  if (!customerId) process.exit(3);

  const keyVariants = {
    b64: Buffer.from(encKey, "base64"),
    utf32: Buffer.from(encKey, "utf8").subarray(0, 32),
    sha256: crypto.createHash("sha256").update(encKey).digest(),
  };
  console.log(
    JSON.stringify({
      step: "key_lengths",
      b64: keyVariants.b64.length,
      utf32: keyVariants.utf32.length,
      sha256: keyVariants.sha256.length,
    })
  );

  let paymentMethodId = null;
  for (const [name, keyBuf] of Object.entries(keyVariants)) {
    if (keyBuf.length !== 16 && keyBuf.length !== 24 && keyBuf.length !== 32) {
      console.log(JSON.stringify({ step: "skip_key", name, length: keyBuf.length }));
      continue;
    }
    for (const mode of ["node", "web"]) {
      const n = nonce();
      const enc =
        mode === "web"
          ? await encryptWeb("5531886652142950", n, keyBuf)
          : encryptWithKey("5531886652142950", n, keyBuf);
      const month =
        mode === "web" ? await encryptWeb("09", n, keyBuf) : encryptWithKey("09", n, keyBuf);
      const year =
        mode === "web" ? await encryptWeb("32", n, keyBuf) : encryptWithKey("32", n, keyBuf);
      const cvv =
        mode === "web" ? await encryptWeb("564", n, keyBuf) : encryptWithKey("564", n, keyBuf);
      const pmRes = await fetch("https://developersandbox-api.flutterwave.com/payment-methods", {
        method: "POST",
        headers: {
          ...headers,
          "X-Idempotency-Key": `mkos-pm-${name}-${mode}-${Date.now()}`,
          "X-Trace-Id": `mkos-pm-${name}-${mode}-${Date.now()}`,
        },
        body: JSON.stringify({
          type: "card",
          card: {
            nonce: n,
            encrypted_card_number: enc,
            encrypted_expiry_month: month,
            encrypted_expiry_year: year,
            encrypted_cvv: cvv,
          },
        }),
      });
      const pm = await pmRes.json();
      console.log(
        JSON.stringify({
          step: "payment_method",
          name,
          mode,
          http: pmRes.status,
          id: pm?.data?.id || null,
          message: pm?.message || pm?.error?.message || null,
          cipher_len: enc.length,
        })
      );
      if (pm?.data?.id) {
        paymentMethodId = pm.data.id;
        break;
      }
    }
    if (paymentMethodId) break;
  }
  if (!paymentMethodId) process.exit(4);

  const ref = `mkosfw${Date.now().toString(36)}chg`;
  const chRes = await fetch("https://developersandbox-api.flutterwave.com/charges", {
    method: "POST",
    headers: { ...headers, "X-Idempotency-Key": `mkos-pay-${Date.now()}` },
    body: JSON.stringify({
      amount: 12.34,
      currency: "USD",
      reference: ref,
      customer_id: customerId,
      payment_method_id: paymentMethodId,
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
      redirect_host: d.next_action?.redirect_url?.url
        ? new URL(d.next_action.redirect_url.url).host
        : null,
      message: ch?.message || ch?.error?.message || null,
    })
  );
}

main().catch((err) => {
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
});
