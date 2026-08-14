// Quick check that the Flutterwave v3 secret key can create a hosted payment link.
// Usage: node scripts/test-flutterwave-v3.js
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv();
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) throw new Error("FLUTTERWAVE_SECRET_KEY missing in .env.local");

  const txRef = `mkos-test-${Date.now()}`;
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: 1,
      currency: "USD",
      redirect_url: "https://mkosv1.netlify.app/checkout/success",
      customer: { email: "test@example.com", name: "MKoS Test" },
      customizations: { title: "My Kind of Style" },
    }),
  });
  const json = await res.json();
  console.log("HTTP", res.status);
  console.log(JSON.stringify(json, null, 2));
  if (json.status === "success" && json.data && json.data.link) {
    console.log("\nOK — hosted checkout link:\n" + json.data.link);
  } else {
    console.log("\nFAILED — check the secret key.");
    process.exit(1);
  }

  // The verify route falls back to this endpoint when only tx_ref is known.
  const refRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const refJson = await refRes.json();
  console.log("\nverify_by_reference HTTP", refRes.status);
  console.log(JSON.stringify(refJson, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
