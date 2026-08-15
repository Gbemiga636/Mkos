// Checks the deployed Flutterwave webhook endpoint: URL reachability and
// verif-hash signature enforcement. Sends only a harmless non-charge event so
// no order fulfilment is triggered.
// Usage: node scripts/test-flutterwave-webhook.js

const URLS = [
  "https://mykindofstyle.com//api/checkout/flutterwave/webhook", // as entered in the dashboard (double slash)
  "https://mykindofstyle.com/api/checkout/flutterwave/webhook", // normalised
  "https://mkosv1.netlify.app/api/checkout/flutterwave/webhook",
];

const SECRET = "mykindofstyle!2026";

// Deliberately not "charge.completed" so nothing gets fulfilled.
const BODY = JSON.stringify({ event: "webhook.test", data: { status: "test" } });

async function hit(url, hash, label) {
  const headers = { "Content-Type": "application/json" };
  if (hash !== null) headers["verif-hash"] = hash;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: BODY,
      redirect: "manual",
    });
    const text = (await res.text()).slice(0, 200);
    const location = res.headers.get("location");
    console.log(
      `  ${label.padEnd(22)} -> ${res.status}${location ? ` (redirect: ${location})` : ""} ${text}`
    );
    return res.status;
  } catch (e) {
    console.log(`  ${label.padEnd(22)} -> NETWORK ERROR ${e.message}`);
    return null;
  }
}

async function main() {
  for (const url of URLS) {
    console.log(`\n${url}`);
    await hit(url, null, "no hash");
    await hit(url, "definitely-wrong", "wrong hash");
    await hit(url, SECRET, "correct hash");
  }

  console.log(`
How to read this:
  correct hash -> 200 {"received":true}   = webhook wired up correctly
  wrong hash   -> 401                     = FLUTTERWAVE_WEBHOOK_SECRET is set (good)
  wrong hash   -> 200                     = secret NOT set in Netlify yet
  any 404/308                             = URL is wrong in the dashboard
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
