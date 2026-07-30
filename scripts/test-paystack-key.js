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

const secret = process.env.PAYSTACK_SECRET_KEY || "";
const pub = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

function describe(label, value) {
  return {
    label,
    present: Boolean(value),
    length: value.length,
    prefix: value.slice(0, 8),
    hasWhitespace: /\s/.test(value),
    looksSecret: value.startsWith("sk_"),
    looksPublic: value.startsWith("pk_"),
    isTest: value.includes("_test_"),
    isLive: value.includes("_live_"),
  };
}

console.log(JSON.stringify({ secret: describe("secret", secret), public: describe("public", pub) }, null, 2));

if (!secret) {
  console.error("FAIL: PAYSTACK_SECRET_KEY missing");
  process.exit(1);
}

(async () => {
  const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=1", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  console.log(
    JSON.stringify(
      {
        httpStatus: res.status,
        ok: data.status === true,
        message: data.message,
      },
      null,
      2
    )
  );
  if (!data.status) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
