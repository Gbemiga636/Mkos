"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBusyStore } from "@/store/busy";

type MoneyBucket = { currency: string; total: number };
type AovBucket = { currency: string; aov: number };
type Editable = {
  summary: string;
  highlights: string;
  challenges: string;
  nextMonthPlan: string;
  goals: string;
  notes: string;
  customRevenueUsd: number | null;
  customRevenueNgn: number | null;
  customOrders: number | null;
  preparedBy: string;
};

type ReportPayload = {
  period: { year: number; month: number; label: string; start: string; end: string };
  metrics: {
    paidOrders: number;
    pendingOrders: number;
    allOrdersInPeriod: number;
    revenueByCurrency: MoneyBucket[];
    aovByCurrency: AovBucket[];
    newSubscribers: number;
    visitors: number;
    pageViews: number;
    experienceInquiries: number;
    styleBriefs: number;
    bespokeInquiries: number;
    bridalInquiries: number;
    publishedProducts: number;
    lowStockCount: number;
  };
  topProducts: { name: string; slug?: string; qty: number; revenue: number }[];
  deliveryBreakdown: Record<string, number>;
  lowStock: { name: string; slug: string; stock: number }[];
  recentPaidOrders: {
    reference: string | null;
    name: string | null;
    email: string | null;
    total: number;
    currency: string;
    paidAt: string;
    items: string;
  }[];
  editable: Editable;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

function Field({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full resize-y border border-mkos-border bg-white px-3 py-3 text-sm leading-relaxed text-mkos-ink outline-none focus:border-mkos-accent"
      />
    </label>
  );
}

export function ReportsClient() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [editable, setEditable] = useState<Editable | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  const load = useCallback(async () => {
    setError("");
    setStatus("");
    await withBusy(async () => {
      const res = await fetch(`/api/admin/reports/monthly?year=${year}&month=${month}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate report");
      setReport(data);
      setEditable(data.editable);
      setStatus(`Report ready · ${data.period.label}`);
    }).catch((err: unknown) => {
      setReport(null);
      setEditable(null);
      setError(err instanceof Error ? err.message : "Could not generate report");
    });
  }, [year, month, withBusy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveNotes() {
    if (!editable || !report) return;
    setStatus("Saving…");
    try {
      const res = await fetch("/api/admin/reports/monthly", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: report.period.year,
          month: report.period.month,
          editable,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStatus("Notes saved for this month");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function downloadPdf() {
    if (!reportRef.current || !report) return;
    setPdfBusy(true);
    setError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const node = reportRef.current;
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: node.scrollWidth,
      });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(img, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 8) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(img, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const file = `MKoS-Monthly-Report-${report.period.year}-${String(report.period.month).padStart(2, "0")}.pdf`;
      pdf.save(file);
      setStatus(`Downloaded ${file}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  }

  const displayOrders =
    editable?.customOrders != null && Number.isFinite(editable.customOrders)
      ? editable.customOrders
      : report?.metrics.paidOrders ?? 0;

  const displayRevenue = useMemo(() => {
    if (!report) return [] as MoneyBucket[];
    const base = [...report.metrics.revenueByCurrency];
    if (editable?.customRevenueUsd != null && Number.isFinite(editable.customRevenueUsd)) {
      const i = base.findIndex((b) => b.currency === "USD");
      if (i >= 0) base[i] = { currency: "USD", total: editable.customRevenueUsd };
      else base.push({ currency: "USD", total: editable.customRevenueUsd });
    }
    if (editable?.customRevenueNgn != null && Number.isFinite(editable.customRevenueNgn)) {
      const i = base.findIndex((b) => b.currency === "NGN");
      if (i >= 0) base[i] = { currency: "NGN", total: editable.customRevenueNgn };
      else base.push({ currency: "NGN", total: editable.customRevenueNgn });
    }
    return base;
  }, [report, editable]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Studio intelligence
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
            Monthly report
          </h1>
          <p className="mt-2 max-w-xl text-sm text-mkos-muted">
            Generate a full performance report, adjust key figures and narrative, then download a
            polished PDF for the house.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border border-mkos-border bg-white p-4">
        <label className="block">
          <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Month
          </span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1.5 block h-11 min-w-[10rem] border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
          >
            {MONTHS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Year
          </span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1.5 block h-11 border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="h-11 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase"
        >
          Generate report
        </button>
        <button
          type="button"
          disabled={!report || !editable || pdfBusy}
          onClick={() => void downloadPdf()}
          className="h-11 border border-mkos-ink bg-white px-5 font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase disabled:opacity-40"
        >
          {pdfBusy ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          disabled={!editable}
          onClick={() => void saveNotes()}
          className="h-11 border border-mkos-border bg-mkos-warm px-5 font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase disabled:opacity-40"
        >
          Save edits
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {status ? <p className="text-sm text-mkos-accent">{status}</p> : null}

      {report && editable ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 print:hidden">
            <div className="space-y-4 border border-mkos-border bg-white p-5">
              <p className="font-display text-[11px] tracking-[0.22em] text-mkos-accent uppercase">
                Edit figures
              </p>
              <p className="text-xs text-mkos-muted">
                Leave blank to keep live totals from the database. Filled values override the PDF.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                    Paid orders
                  </span>
                  <input
                    type="number"
                    value={editable.customOrders ?? ""}
                    placeholder={String(report.metrics.paidOrders)}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        customOrders: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                    Revenue USD
                  </span>
                  <input
                    type="number"
                    value={editable.customRevenueUsd ?? ""}
                    placeholder={String(
                      report.metrics.revenueByCurrency.find((r) => r.currency === "USD")?.total ??
                        ""
                    )}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        customRevenueUsd: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                    Revenue NGN
                  </span>
                  <input
                    type="number"
                    value={editable.customRevenueNgn ?? ""}
                    placeholder={String(
                      report.metrics.revenueByCurrency.find((r) => r.currency === "NGN")?.total ??
                        ""
                    )}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        customRevenueNgn: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                  Prepared by
                </span>
                <input
                  value={editable.preparedBy}
                  onChange={(e) => setEditable({ ...editable, preparedBy: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                />
              </label>
            </div>
            <div className="space-y-3 border border-mkos-border bg-white p-5">
              <Field
                label="Executive summary"
                value={editable.summary}
                onChange={(v) => setEditable({ ...editable, summary: v })}
                rows={4}
              />
            </div>
            <div className="border border-mkos-border bg-white p-5">
              <Field
                label="Highlights"
                value={editable.highlights}
                onChange={(v) => setEditable({ ...editable, highlights: v })}
              />
            </div>
            <div className="border border-mkos-border bg-white p-5">
              <Field
                label="Challenges"
                value={editable.challenges}
                onChange={(v) => setEditable({ ...editable, challenges: v })}
              />
            </div>
            <div className="border border-mkos-border bg-white p-5">
              <Field
                label="Next month plan"
                value={editable.nextMonthPlan}
                onChange={(v) => setEditable({ ...editable, nextMonthPlan: v })}
              />
            </div>
            <div className="border border-mkos-border bg-white p-5">
              <Field
                label="Goals"
                value={editable.goals}
                onChange={(v) => setEditable({ ...editable, goals: v })}
                rows={3}
              />
            </div>
            <div className="border border-mkos-border bg-white p-5 lg:col-span-2">
              <Field
                label="Additional notes"
                value={editable.notes}
                onChange={(v) => setEditable({ ...editable, notes: v })}
                rows={3}
              />
            </div>
          </div>

          <div
            ref={reportRef}
            className="overflow-hidden border border-mkos-border bg-[#faf8f5] text-mkos-ink shadow-soft"
          >
            <div
              className="relative overflow-hidden bg-mkos-ink px-8 py-12 text-white sm:px-12"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(196,92,38,0.25) 0%, transparent 45%), linear-gradient(180deg, #111 0%, #1a1a1a 100%)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mkos-accent/60 to-transparent" />
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="font-display text-[11px] tracking-[0.35em] text-white/55 uppercase">
                    My Kind of Style · MKoS
                  </p>
                  <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                    Monthly business report
                  </h2>
                  <p className="mt-3 font-display text-xl text-mkos-accent">{report.period.label}</p>
                  <p className="mt-6 max-w-md text-sm leading-relaxed text-white/55">
                    Performance, enquiries, inventory, and next-month direction for the house.
                  </p>
                </div>
                <div className="min-w-[11rem] border border-white/15 bg-white/5 px-5 py-4 text-right text-sm text-white/70 backdrop-blur-sm">
                  <p className="font-display text-[10px] tracking-[0.18em] text-white/45 uppercase">
                    Prepared by
                  </p>
                  <p className="mt-1 text-white">{editable.preparedBy}</p>
                  <p className="mt-3 font-display text-[10px] tracking-[0.18em] text-white/45 uppercase">
                    Generated
                  </p>
                  <p className="mt-1">
                    {new Date().toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  </p>
                  <p className="mt-4 font-display text-[10px] tracking-[0.2em] text-mkos-accent/80 uppercase">
                    Confidential · Internal
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-12 px-8 py-12 sm:px-12">
              <section>
                <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                  <span className="font-display text-2xl text-mkos-accent/40">01</span>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                    Executive summary
                  </p>
                </div>
                <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-mkos-ink/90">
                  {editable.summary}
                </p>
              </section>

              <section>
                <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                  <span className="font-display text-2xl text-mkos-accent/40">02</span>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                    Performance snapshot
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Paid orders", value: String(displayOrders) },
                    {
                      label: "Revenue",
                      value:
                        displayRevenue.map((r) => money(r.total, r.currency)).join(" · ") || "—",
                    },
                    { label: "Visitors", value: String(report.metrics.visitors) },
                    { label: "Page views", value: String(report.metrics.pageViews) },
                    {
                      label: "New subscribers",
                      value: String(report.metrics.newSubscribers),
                    },
                    {
                      label: "Experience enquiries",
                      value: String(report.metrics.experienceInquiries),
                    },
                    {
                      label: "Bespoke / bridal / briefs",
                      value: `${report.metrics.bespokeInquiries} / ${report.metrics.bridalInquiries} / ${report.metrics.styleBriefs}`,
                    },
                    {
                      label: "Pending payments",
                      value: String(report.metrics.pendingOrders),
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="border border-mkos-border bg-white p-4 shadow-[0_1px_0_rgba(17,17,17,0.04)]"
                    >
                      <p className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                        {card.label}
                      </p>
                      <p className="mt-3 font-display text-xl tracking-tight">{card.value}</p>
                    </div>
                  ))}
                </div>
                {report.metrics.aovByCurrency.length ? (
                  <p className="mt-4 text-sm text-mkos-muted">
                    Average order value:{" "}
                    {report.metrics.aovByCurrency
                      .map((a) => `${money(a.aov, a.currency)}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </section>

              <section className="grid gap-8 lg:grid-cols-2">
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">03</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Highlights
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mkos-ink/90">
                    {editable.highlights}
                  </p>
                </div>
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">04</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Challenges
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mkos-ink/90">
                    {editable.challenges}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                  <span className="font-display text-2xl text-mkos-accent/40">05</span>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                    Top products
                  </p>
                </div>
                {report.topProducts.length ? (
                  <table className="mt-5 w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-mkos-border font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                        <th className="py-2 font-normal">Style</th>
                        <th className="py-2 font-normal">Qty</th>
                        <th className="py-2 font-normal">Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topProducts.map((p) => (
                        <tr key={p.slug || p.name} className="border-b border-mkos-border/70 bg-white/50">
                          <td className="py-3 font-display">{p.name}</td>
                          <td className="py-3 tabular-nums">{p.qty}</td>
                          <td className="py-3 tabular-nums">{p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-4 text-sm text-mkos-muted">No paid product lines in this month.</p>
                )}
              </section>

              <section className="grid gap-8 lg:grid-cols-2">
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">06</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Delivery mix
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {Object.keys(report.deliveryBreakdown).length ? (
                      Object.entries(report.deliveryBreakdown).map(([k, v]) => (
                        <li
                          key={k}
                          className="flex justify-between border-b border-mkos-border/60 py-2"
                        >
                          <span>{deliveryLabel(k)}</span>
                          <span className="tabular-nums">{v}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-mkos-muted">No delivery data yet.</li>
                    )}
                  </ul>
                </div>
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">07</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Inventory watch
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {report.lowStock.length ? (
                      report.lowStock.map((p) => (
                        <li
                          key={p.slug}
                          className="flex justify-between border-b border-mkos-border/60 py-2"
                        >
                          <span>{p.name}</span>
                          <span className="tabular-nums text-mkos-accent">{p.stock} left</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-mkos-muted">No critical low-stock items.</li>
                    )}
                  </ul>
                </div>
              </section>

              <section>
                <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                  <span className="font-display text-2xl text-mkos-accent/40">08</span>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                    Paid orders this month
                  </p>
                </div>
                {report.recentPaidOrders.length ? (
                  <div className="mt-4 space-y-3">
                    {report.recentPaidOrders.map((o, i) => (
                      <div
                        key={`${o.reference}-${i}`}
                        className="border border-mkos-border bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-sm">
                            {o.name || "Client"} · {o.reference || "—"}
                          </p>
                          <p className="font-display text-sm text-mkos-accent">
                            {money(o.total, o.currency)}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-mkos-muted">
                          {o.email} · {o.items || "Items on file"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-mkos-muted">No paid orders recorded for this month.</p>
                )}
              </section>

              <section className="grid gap-8 border-t border-mkos-border pt-10 lg:grid-cols-2">
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">09</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Next month plan
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {editable.nextMonthPlan}
                  </p>
                </div>
                <div className="border border-mkos-border bg-white p-6">
                  <div className="flex items-baseline gap-3 border-b border-mkos-border pb-3">
                    <span className="font-display text-2xl text-mkos-accent/40">10</span>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Goals
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{editable.goals}</p>
                  {editable.notes ? (
                    <>
                      <p className="mt-8 font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                        Notes
                      </p>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mkos-muted">
                        {editable.notes}
                      </p>
                    </>
                  ) : null}
                </div>
              </section>

              <footer className="border-t border-mkos-border pt-10 text-center">
                <div className="mx-auto mb-4 h-px w-16 bg-mkos-accent/50" />
                <p className="font-display text-[11px] tracking-[0.3em] text-mkos-muted uppercase">
                  For Those Who Understand STYLE
                </p>
                <p className="mt-2 text-xs text-mkos-muted">
                  mykindofstyle.com · Oniru, Lagos · styleme@mykindofstyle.com
                </p>
              </footer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
