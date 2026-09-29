/**
 * Export a monthly report to PDF locally (uses .env.local + Microsoft Edge headless).
 *   npx tsx scripts/export-monthly-report.ts 2026 9
 */
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

config({ path: ".env.local" });

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

function deliveryLabel(key: string) {
  const map: Record<string, string> = {
    pickup: "Studio pickup",
    home_delivery: "Home delivery",
    international: "International",
    unspecified: "Unspecified",
  };
  return map[key] || key;
}

function bullets(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return `<p class="muted">—</p>`;
  const isList = lines.every((l) => /^[•\-*]/.test(l));
  if (!isList) return `<p class="prose">${esc(text)}</p>`;
  return `<ul class="bullets">${lines
    .map((l) => `<li>${esc(l.replace(/^[•\-*]\s*/, ""))}</li>`)
    .join("")}</ul>`;
}

function sectionHead(n: string, title: string) {
  return `<div class="shead"><span class="snum">${n}</span><span class="stitle">${esc(title)}</span></div>`;
}

async function main() {
  const now = new Date();
  const year = Number(process.argv[2]) || now.getFullYear();
  const month = Number(process.argv[3]) || now.getMonth() + 1;

  const { createServiceClient } = await import("../src/lib/supabase/client");
  const { buildMonthlyReport } = await import("../src/lib/reports/monthly");
  const r = await buildMonthlyReport(createServiceClient(), year, month, "MKoS Studio");
  const e = r.editable;
  const m = r.metrics;

  const orders =
    e.customOrders != null && Number.isFinite(e.customOrders) ? e.customOrders : m.paidOrders;
  const revenue = [...m.revenueByCurrency];
  const override = (currency: string, value: number | null) => {
    if (value == null || !Number.isFinite(value)) return;
    const i = revenue.findIndex((b) => b.currency === currency);
    if (i >= 0) revenue[i] = { currency, total: value };
    else revenue.push({ currency, total: value });
  };
  override("USD", e.customRevenueUsd);
  override("NGN", e.customRevenueNgn);

  const conversion =
    m.visitors > 0 ? `${((orders / m.visitors) * 100).toFixed(2)}%` : "—";
  const totalEnquiries =
    m.experienceInquiries + m.bespokeInquiries + m.bridalInquiries + m.styleBriefs;

  const kpis: [string, string, string?][] = [
    ["Paid orders", String(orders), `${m.allOrdersInPeriod} orders created in period`],
    [
      "Revenue",
      revenue.map((x) => money(x.total, x.currency)).join("<br/>") || "—",
      "Paid orders only",
    ],
    [
      "Average order",
      m.aovByCurrency.map((a) => money(a.aov, a.currency)).join("<br/>") || "—",
      "Per currency",
    ],
    ["Pending payments", String(m.pendingOrders), "Awaiting completion"],
    ["Visitors", m.visitors.toLocaleString(), `Conversion ${conversion}`],
    ["Page views", m.pageViews.toLocaleString(), "Storefront traffic"],
    ["New subscribers", String(m.newSubscribers), "Email list growth"],
    ["All enquiries", String(totalEnquiries), "Studio + atelier"],
  ];

  const enquiryRows: [string, number][] = [
    ["MKoS Experience", m.experienceInquiries],
    ["Bespoke atelier", m.bespokeInquiries],
    ["Bridal", m.bridalInquiries],
    ["Style briefs", m.styleBriefs],
  ];
  const maxEnq = Math.max(1, ...enquiryRows.map(([, v]) => v));

  const deliveryEntries = Object.entries(r.deliveryBreakdown);
  const deliveryTotal = deliveryEntries.reduce((s, [, v]) => s + v, 0) || 1;

  const generated = now.toLocaleDateString("en-GB", { dateStyle: "long" });

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>MKoS Monthly Report — ${esc(r.period.label)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Inter, sans-serif; color: #111; background: #faf8f5; font-size: 10.5pt; line-height: 1.55; }
  .display { font-family: "Space Grotesk", sans-serif; }
  .page { width: 210mm; min-height: 297mm; padding: 16mm 16mm 18mm; position: relative; page-break-after: always; background: #faf8f5; }
  .page:last-child { page-break-after: auto; }
  .cover { background: #111; color: #fff; padding: 0; display: flex; flex-direction: column; justify-content: space-between;
    background-image: linear-gradient(135deg, rgba(196,92,38,0.35) 0%, transparent 50%), linear-gradient(180deg, #111 0%, #1b1b1b 100%); }
  .cover-inner { padding: 26mm 20mm 0; }
  .eyebrow { font-family: "Space Grotesk"; font-size: 8pt; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
  .cover h1 { font-family: "Space Grotesk"; font-weight: 500; font-size: 44pt; line-height: 1.02; letter-spacing: -0.02em; margin-top: 18mm; }
  .cover .period { font-family: "Space Grotesk"; font-size: 22pt; color: #e07a45; margin-top: 6mm; }
  .cover .lede { max-width: 120mm; margin-top: 10mm; color: rgba(255,255,255,0.6); font-size: 11pt; }
  .cover-rule { height: 1px; margin: 16mm 20mm 0; background: linear-gradient(90deg, #c45c26, rgba(196,92,38,0)); }
  .cover-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; padding: 10mm 20mm 20mm; }
  .cover-meta div p:first-child { font-family: "Space Grotesk"; font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
  .cover-meta div p:last-child { margin-top: 2mm; font-size: 11pt; color: #fff; }
  .cover-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.12); margin: 14mm 20mm 0; border: 1px solid rgba(255,255,255,0.12); }
  .cover-kpis div { background: rgba(17,17,17,0.85); padding: 6mm; }
  .cover-kpis .l { font-family: "Space Grotesk"; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .cover-kpis .v { font-family: "Space Grotesk"; font-size: 17pt; margin-top: 3mm; line-height: 1.2; }
  .runhead { display: flex; justify-content: space-between; font-family: "Space Grotesk"; font-size: 7pt; letter-spacing: 0.25em; text-transform: uppercase; color: #8a8a8a; border-bottom: 1px solid rgba(17,17,17,0.1); padding-bottom: 3mm; margin-bottom: 9mm; }
  .runhead b { color: #c45c26; font-weight: 500; }
  .foot { position: absolute; left: 16mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 7pt; color: #9a9a9a; letter-spacing: 0.08em; }
  section { margin-bottom: 10mm; break-inside: avoid; }
  .shead { display: flex; align-items: baseline; gap: 4mm; border-bottom: 1px solid rgba(17,17,17,0.1); padding-bottom: 2.5mm; margin-bottom: 5mm; }
  .snum { font-family: "Space Grotesk"; font-size: 20pt; color: rgba(196,92,38,0.4); line-height: 1; }
  .stitle { font-family: "Space Grotesk"; font-size: 8pt; letter-spacing: 0.28em; text-transform: uppercase; color: #c45c26; }
  .prose { white-space: pre-wrap; font-size: 11pt; color: #222; }
  .summary { font-size: 12.5pt; line-height: 1.65; color: #1a1a1a; border-left: 2px solid #c45c26; padding-left: 6mm; white-space: pre-wrap; }
  .muted { color: #6b6b6b; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .card { background: #fff; border: 1px solid rgba(17,17,17,0.08); padding: 5mm; }
  .kpi .l { font-family: "Space Grotesk"; font-size: 6.8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  .kpi .v { font-family: "Space Grotesk"; font-size: 15pt; margin-top: 3mm; line-height: 1.2; letter-spacing: -0.01em; }
  .kpi .s { font-size: 7.5pt; color: #8a8a8a; margin-top: 2mm; }
  .bullets { list-style: none; }
  .bullets li { position: relative; padding-left: 5mm; margin-bottom: 2mm; }
  .bullets li::before { content: ""; position: absolute; left: 0; top: 2.2mm; width: 2mm; height: 2mm; background: #c45c26; }
  table { width: 100%; border-collapse: collapse; }
  th { font-family: "Space Grotesk"; font-weight: 400; font-size: 7pt; letter-spacing: 0.16em; text-transform: uppercase; color: #6b6b6b; text-align: left; padding: 2.5mm 3mm; border-bottom: 1px solid rgba(17,17,17,0.15); }
  td { padding: 3mm; border-bottom: 1px solid rgba(17,17,17,0.07); vertical-align: top; }
  tbody tr:nth-child(odd) td { background: #fff; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rank { font-family: "Space Grotesk"; color: #c45c26; width: 8mm; }
  .bar-row { display: grid; grid-template-columns: 34mm 1fr 10mm; align-items: center; gap: 3mm; margin-bottom: 3mm; font-size: 9.5pt; }
  .bar { height: 3mm; background: rgba(17,17,17,0.06); }
  .bar span { display: block; height: 100%; background: linear-gradient(90deg, #c45c26, #e07a45); }
  .order { display: flex; justify-content: space-between; gap: 4mm; padding: 3mm 4mm; background: #fff; border: 1px solid rgba(17,17,17,0.07); margin-bottom: 2mm; break-inside: avoid; }
  .order .n { font-family: "Space Grotesk"; font-size: 9.5pt; }
  .order .d { font-size: 7.8pt; color: #6b6b6b; margin-top: 1mm; }
  .order .a { font-family: "Space Grotesk"; color: #c45c26; white-space: nowrap; }
  .plan { background: #111; color: #fff; padding: 8mm; }
  .plan .stitle { color: #e07a45; }
  .plan .snum { color: rgba(224,122,69,0.45); }
  .plan .shead { border-color: rgba(255,255,255,0.15); }
  .plan .bullets li::before { background: #e07a45; }
  .plan .prose { color: rgba(255,255,255,0.85); }
  .sign { margin-top: 14mm; display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; }
  .sign div { border-top: 1px solid rgba(17,17,17,0.25); padding-top: 2mm; font-size: 8pt; color: #6b6b6b; }
  .closing { text-align: center; margin-top: 14mm; }
  .closing .rule { width: 16mm; height: 1px; background: #c45c26; margin: 0 auto 4mm; }
  .closing p:first-of-type { font-family: "Space Grotesk"; font-size: 8pt; letter-spacing: 0.3em; text-transform: uppercase; color: #6b6b6b; }
</style></head><body>

<div class="page cover">
  <div>
    <div class="cover-inner">
      <p class="eyebrow">My Kind of Style · MKoS</p>
      <h1>Monthly<br/>business report</h1>
      <p class="period">${esc(r.period.label)}</p>
      <p class="lede">Performance, enquiries, inventory and next-month direction for the house.</p>
    </div>
    <div class="cover-kpis">
      <div><p class="l">Paid orders</p><p class="v">${orders}</p></div>
      <div><p class="l">Revenue</p><p class="v">${revenue.map((x) => money(x.total, x.currency)).join("<br/>") || "—"}</p></div>
      <div><p class="l">Visitors</p><p class="v">${m.visitors.toLocaleString()}</p></div>
    </div>
  </div>
  <div>
    <div class="cover-rule"></div>
    <div class="cover-meta">
      <div><p>Prepared by</p><p>${esc(e.preparedBy)}</p></div>
      <div><p>Generated</p><p>${esc(generated)}</p></div>
      <div><p>Classification</p><p>Confidential · Internal</p></div>
    </div>
  </div>
</div>

<div class="page">
  <div class="runhead"><span>MKoS · Monthly report</span><b>${esc(r.period.label)}</b></div>
  <section>${sectionHead("01", "Executive summary")}<p class="summary">${esc(e.summary)}</p></section>
  <section>${sectionHead("02", "Performance snapshot")}
    <div class="grid4">${kpis
      .map(
        ([l, v, s]) =>
          `<div class="card kpi"><p class="l">${esc(l)}</p><p class="v">${v}</p>${s ? `<p class="s">${esc(s)}</p>` : ""}</div>`
      )
      .join("")}</div>
  </section>
  <section class="grid2">
    <div class="card">${sectionHead("03", "Highlights")}${bullets(e.highlights)}</div>
    <div class="card">${sectionHead("04", "Challenges")}${bullets(e.challenges)}</div>
  </section>
  <section>${sectionHead("05", "Enquiry pipeline")}
    <div class="card">${enquiryRows
      .map(
        ([l, v]) =>
          `<div class="bar-row"><span>${esc(l)}</span><div class="bar"><span style="width:${Math.round((v / maxEnq) * 100)}%"></span></div><span class="num">${v}</span></div>`
      )
      .join("")}</div>
  </section>
  <div class="foot"><span>mykindofstyle.com</span><span>Page 2</span></div>
</div>

<div class="page">
  <div class="runhead"><span>MKoS · Monthly report</span><b>${esc(r.period.label)}</b></div>
  <section>${sectionHead("06", "Top products")}
    ${
      r.topProducts.length
        ? `<table><thead><tr><th></th><th>Style</th><th class="num">Qty</th><th class="num">Line total</th></tr></thead><tbody>${r.topProducts
            .map(
              (p, i) =>
                `<tr><td class="rank">${String(i + 1).padStart(2, "0")}</td><td class="display">${esc(p.name)}</td><td class="num">${p.qty}</td><td class="num">${p.revenue.toLocaleString()}</td></tr>`
            )
            .join("")}</tbody></table>`
        : `<p class="muted">No paid product lines this month.</p>`
    }
  </section>
  <section class="grid2">
    <div class="card">${sectionHead("07", "Delivery mix")}
      ${
        deliveryEntries.length
          ? deliveryEntries
              .map(
                ([k, v]) =>
                  `<div class="bar-row"><span>${esc(deliveryLabel(k))}</span><div class="bar"><span style="width:${Math.round((v / deliveryTotal) * 100)}%"></span></div><span class="num">${v}</span></div>`
              )
              .join("")
          : `<p class="muted">No delivery data yet.</p>`
      }
    </div>
    <div class="card">${sectionHead("08", "Inventory watch")}
      ${
        r.lowStock.length
          ? `<table><tbody>${r.lowStock
              .map(
                (p) =>
                  `<tr><td>${esc(p.name)}</td><td class="num" style="color:#c45c26">${p.stock} left</td></tr>`
              )
              .join("")}</tbody></table>`
          : `<p class="muted">No critical low-stock items.</p>`
      }
      <p class="muted" style="margin-top:3mm;font-size:8pt">${m.publishedProducts} published styles · ${m.lowStockCount} at 5 units or fewer</p>
    </div>
  </section>
  <div class="foot"><span>mykindofstyle.com</span><span>Page 3</span></div>
</div>

<div class="page">
  <div class="runhead"><span>MKoS · Monthly report</span><b>${esc(r.period.label)}</b></div>
  <section>${sectionHead("09", "Paid orders this month")}
    ${
      r.recentPaidOrders.length
        ? r.recentPaidOrders
            .map(
              (o) =>
                `<div class="order"><div><p class="n">${esc(o.name || "Client")} · ${esc(o.reference || "—")}</p><p class="d">${esc(new Date(o.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))} · ${esc(o.email)} · ${esc(o.items || "Items on file")}</p></div><p class="a">${money(o.total, o.currency)}</p></div>`
            )
            .join("")
        : `<p class="muted">No paid orders recorded this month.</p>`
    }
  </section>
  <div class="foot"><span>mykindofstyle.com</span><span>Page 4</span></div>
</div>

<div class="page">
  <div class="runhead"><span>MKoS · Monthly report</span><b>${esc(r.period.label)}</b></div>
  <section class="plan">${sectionHead("10", "Next month plan")}${bullets(e.nextMonthPlan)}</section>
  <section class="card">${sectionHead("11", "Goals")}${bullets(e.goals)}</section>
  ${e.notes ? `<section class="card">${sectionHead("12", "Notes")}<p class="prose muted">${esc(e.notes)}</p></section>` : ""}
  <div class="sign"><div>Prepared by · ${esc(e.preparedBy)}</div><div>Approved by</div></div>
  <div class="closing"><div class="rule"></div><p>For Those Who Understand STYLE</p><p class="muted" style="font-size:8pt;margin-top:2mm">mykindofstyle.com · Oniru, Lagos · styleme@mykindofstyle.com</p></div>
  <div class="foot"><span>mykindofstyle.com</span><span>Page 5</span></div>
</div>

</body></html>`;

  const outDir = path.resolve("reports");
  mkdirSync(outDir, { recursive: true });
  const base = `MKoS-Monthly-Report-${year}-${String(month).padStart(2, "0")}`;
  const htmlPath = path.join(outDir, `${base}.html`);
  const pdfPath = path.join(outDir, `${base}.pdf`);
  writeFileSync(htmlPath, html, "utf8");

  const browser = BROWSERS.find((b) => existsSync(b));
  if (!browser) {
    console.log(`No Edge/Chrome found. Open ${htmlPath} and print to PDF.`);
    return;
  }
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ]);
  console.log(
    JSON.stringify(
      { pdf: pdfPath, paidOrders: orders, revenue, visitors: m.visitors, enquiries: totalEnquiries },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
