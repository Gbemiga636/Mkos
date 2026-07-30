const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

function loadEnv(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "MKoS <hello@mykindofstyle.com>";
const to = process.argv[2] || "gboisholaja@gmail.com";

if (!key) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const html = `
<div style="font-family:Georgia,serif;padding:32px;color:#111">
  <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#c45c26">MKoS</p>
  <h1 style="font-size:28px;margin:12px 0">Email test successful</h1>
  <p style="color:#6b6b6b;line-height:1.6">
    Your Resend key is connected for mykindofstyle.com.
    Order confirmations, bespoke briefs, and experience inquiries will send from this setup.
  </p>
  <p style="margin-top:24px;font-size:13px;color:#6b6b6b">Sent to ${to}</p>
</div>
`;

const resend = new Resend(key);

resend.emails
  .send({
    from,
    to,
    subject: "MKoS email test · Resend is live",
    html,
  })
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    if (r.error) process.exit(2);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
