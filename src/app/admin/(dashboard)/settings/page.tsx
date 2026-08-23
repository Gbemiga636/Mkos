"use client";

import { useEffect, useState } from "react";

type PromoRow = { code: string; percent: string };

export default function SettingsPage() {
  const [form, setForm] = useState({
    brand_name: "MKoS",
    tagline: "",
    logo_url: "",
    currency: "NGN",
    instagram: "",
    whatsapp: "",
  });
  const [promos, setPromos] = useState<PromoRow[]>([{ code: "", percent: "" }]);
  const [status, setStatus] = useState("");
  const [promoStatus, setPromoStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            brand_name: (d.settings.brand_name ?? "MKoS").replace(/\bmkos\b/gi, "MKoS"),
            tagline: d.settings.tagline ?? "",
            logo_url: d.settings.logo_url ?? "",
            currency: d.settings.currency ?? "NGN",
            instagram: d.settings.social?.instagram ?? "",
            whatsapp: d.settings.social?.whatsapp ?? "",
          });
        }
      });
    fetch("/api/admin/promos")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.codes) && d.codes.length) {
          setPromos(
            d.codes.map((c: { code: string; percent: number }) => ({
              code: c.code,
              percent: String(c.percent),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Saving…");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setStatus(res.ok ? "Saved — branding live on site" : data.error || "Failed");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          System
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Settings
        </h1>
      </div>
      <form onSubmit={save} className="space-y-4 border border-mkos-border bg-white p-6">
        {(
          [
            ["brand_name", "Brand name"],
            ["tagline", "Tagline"],
            ["logo_url", "Logo URL"],
            ["currency", "Currency"],
            ["instagram", "Instagram URL"],
            ["whatsapp", "WhatsApp URL"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
              {label}
            </span>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
            />
            {key === "brand_name" ? (
              <p className="mt-1.5 text-xs text-mkos-muted">
                Use <span className="font-medium text-mkos-ink">MKoS</span> (lowercase o) — never
                MKOS.
              </p>
            ) : null}
          </label>
        ))}
        <button
          type="submit"
          className="h-11 bg-mkos-accent px-6 font-display text-[10px] tracking-[0.16em] text-white uppercase"
        >
          Save settings
        </button>
        {status && <p className="text-sm text-mkos-accent">{status}</p>}
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPromoStatus("Saving…");
          const codes = promos
            .map((p) => ({
              code: p.code.trim(),
              percent: Number(p.percent),
              active: true,
            }))
            .filter((p) => p.code && Number.isFinite(p.percent) && p.percent > 0);
          const res = await fetch("/api/admin/promos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codes }),
          });
          const data = await res.json();
          setPromoStatus(res.ok ? "Saved — codes live at checkout" : data.error || "Failed");
        }}
        className="space-y-4 border border-mkos-border bg-white p-6"
      >
        <div>
          <p className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Discount codes
          </p>
          <h2 className="mt-1 font-display text-xl text-mkos-ink">Checkout promo</h2>
          <p className="mt-2 text-sm text-mkos-muted">
            Shoppers enter the code at checkout. The percent off is taken from the amount due now
            (product total in USD).
          </p>
        </div>
        <div className="space-y-3">
          {promos.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <input
                value={row.code}
                onChange={(e) =>
                  setPromos((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, code: e.target.value } : r))
                  )
                }
                placeholder="CODE"
                className="h-11 border border-mkos-border px-3 text-sm uppercase outline-none focus:border-mkos-accent"
              />
              <input
                value={row.percent}
                onChange={(e) =>
                  setPromos((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, percent: e.target.value } : r))
                  )
                }
                placeholder="%"
                inputMode="decimal"
                className="h-11 border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
              />
              <button
                type="button"
                onClick={() =>
                  setPromos((rows) => (rows.length === 1 ? [{ code: "", percent: "" }] : rows.filter((_, idx) => idx !== i)))
                }
                className="h-11 px-3 font-display text-[10px] tracking-[0.14em] text-mkos-muted uppercase"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPromos((rows) => [...rows, { code: "", percent: "" }])}
          className="font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase"
        >
          + Add code
        </button>
        <div>
          <button
            type="submit"
            className="h-11 bg-mkos-ink px-6 font-display text-[10px] tracking-[0.16em] text-white uppercase"
          >
            Save promo codes
          </button>
          {promoStatus && <p className="mt-3 text-sm text-mkos-accent">{promoStatus}</p>}
        </div>
      </form>
    </div>
  );
}
