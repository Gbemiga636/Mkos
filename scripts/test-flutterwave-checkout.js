const fs = require("fs");
const path = require("path");

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

async function main() {
  const clientId = process.env.FLUTTERWAVE_CLIENT_ID;
  const clientSecret = process.env.FLUTTERWAVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
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

  const headers = {
    Authorization: `Bearer ${tokenJson.access_token}`,
    "Content-Type": "application/json",
    "X-Trace-Id": `mkos-test-${Date.now()}`,
    "X-Idempotency-Key": `mkos-idemp-${Date.now()}`,
  };

  const email = "checkout.test@mykindofstyle.com";
  const cusRes = await fetch("https://developersandbox-api.flutterwave.com/customers", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      name: { first: "MKoS", last: "Test" },
    }),
  });
  const cus = await cusRes.json();
  let customerId = cus?.data?.id || null;
  if (!customerId) {
    const lookRes = await fetch(
      `https://developersandbox-api.flutterwave.com/customers?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          "X-Trace-Id": `mkos-cus-${Date.now()}`,
        },
      }
    );
    const look = await lookRes.json();
    const found = Array.isArray(look?.data) ? look.data[0] : look?.data;
    customerId = found?.id || cus?.error?.id || null;
    console.log(
      JSON.stringify({
        step: "customer_lookup",
        http: lookRes.status,
        data_type: Array.isArray(look?.data) ? "array" : typeof look?.data,
        customer_id: customerId,
        message: look?.message || look?.error?.message || cus?.message || null,
        error_keys: cus?.error ? Object.keys(cus.error) : [],
      })
    );
  }
  console.log(
    JSON.stringify({
      step: "customer",
      http: cusRes.status,
      customer_id: customerId,
      message: cus?.message || cus?.error?.message || null,
    })
  );
  if (!customerId) process.exit(3);

  const ref = `mkosfw${Date.now().toString(36)}test`;
  const sessRes = await fetch(
    "https://developersandbox-api.flutterwave.com/checkout/sessions",
    {
      method: "POST",
      headers: { ...headers, "X-Idempotency-Key": `mkos-sess-${Date.now()}` },
      body: JSON.stringify({
        amount: 12.34,
        currency: "USD",
        customer_id: customerId,
        redirect_url: `http://localhost:3000/checkout/success?reference=${ref}`,
        reference: ref,
        session_duration: 30,
      }),
    }
  );
  const sess = await sessRes.json();
  const data = sess?.data || {};
  console.log(
    JSON.stringify({
      step: "checkout_session",
      http: sessRes.status,
      session_id: data.id || null,
      data_keys: Object.keys(data),
      checkout_url: data.checkout_url || data.url || data.link || null,
      message: sess?.message || sess?.error?.message || null,
      error: sess?.error || null,
    })
  );

  if (data.id && !(data.checkout_url || data.url || data.link)) {
    const probes = [
      `/checkout/sessions/${encodeURIComponent(data.id)}`,
      `/checkout/sessions/${encodeURIComponent(data.id)}/url`,
      `/v4/checkout/sessions/${encodeURIComponent(data.id)}`,
    ];
    for (const path of probes) {
      const getRes = await fetch(`https://developersandbox-api.flutterwave.com${path}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          "X-Trace-Id": `mkos-get-${Date.now()}`,
        },
      });
      const got = await getRes.json().catch(() => ({}));
      const g = got?.data || {};
      console.log(
        JSON.stringify({
          step: "probe",
          path,
          http: getRes.status,
          data_keys: g && typeof g === "object" ? Object.keys(g) : [],
          checkout_url: g.checkout_url || g.url || g.link || null,
          message: got?.message || got?.error?.message || null,
        })
      );
    }

    const v4Res = await fetch("https://api.flutterwave.com/v4/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/json",
        "X-Trace-Id": `mkos-v4-${Date.now()}`,
        "X-Idempotency-Key": `mkos-v4-${Date.now()}`,
      },
      body: JSON.stringify({
        amount: 12.34,
        currency: "USD",
        customer_id: customerId,
        redirect_url: `http://localhost:3000/checkout/success?reference=${ref}`,
        reference: `${ref}v4`,
        session_duration: 30,
      }),
    });
    const v4 = await v4Res.json().catch(() => ({}));
    console.log(
      JSON.stringify({
        step: "api_v4_checkout",
        http: v4Res.status,
        data_keys: v4?.data && typeof v4.data === "object" ? Object.keys(v4.data) : [],
        checkout_url: v4?.data?.checkout_url || v4?.data?.url || v4?.data?.link || null,
        message: v4?.message || v4?.error?.message || null,
      })
    );
  }
}

main().catch((err) => {
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
});
