"use client";

import { useEffect, useState } from "react";

type PromoRow = { code: string; amountOff: string; minItems: string };

const emptyPromo = (): PromoRow => ({ code: "", amountOff: "", minItems: "1" });
const MIN_ITEM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SettingsPage() {
  const [form, setForm] = useState({
    brand_name: "MKoS",
    tagline: "",
    logo_url: "",
    currency: "NGN",
    instagram: "",
    whatsapp: "",
  });
  const [promos, setPromos] = useState<PromoRow[]>([emptyPromo()]);
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
            d.codes.map((c: { code: string; amountOff?: number; minItems?: number }) => ({
              code: c.code,
              amountOff: c.amountOff != null ? String(c.amountOff) : "",
              minItems: String(c.minItems && c.minItems > 0 ? c.minItems : 1),
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
              amountOff: Number(p.amountOff),
              minItems: Math.max(1, Math.round(Number(p.minItems) || 1)),
              active: true,
            }))
            .filter((p) => p.code && Number.isFinite(p.amountOff) && p.amountOff > 0);
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
            Enter the code and the amount to take off the total. That same number is subtracted in
            every currency — 24 off is 24 whether the shopper is in USD, GBP, or anywhere else.
            Set how many pieces must be in the bag before the code can be used.
          </p>
        </div>
        <div className="space-y-3">
          {promos.map((row, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem_11rem_auto]">
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
                value={row.amountOff}
                onChange={(e) =>
                  setPromos((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, amountOff: e.target.value } : r))
                  )
                }
                placeholder="24 off"
                inputMode="decimal"
                className="h-11 border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                aria-label="Amount off"
              />
              <select
                value={row.minItems}
                onChange={(e) =>
                  setPromos((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, minItems: e.target.value } : r))
                  )
                }
                className="h-11 border border-mkos-border bg-white px-2 text-sm outline-none focus:border-mkos-accent"
                aria-label="Minimum items"
              >
                {MIN_ITEM_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n === 1 ? "1 item" : `${n} items or more`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setPromos((rows) => (rows.length === 1 ? [emptyPromo()] : rows.filter((_, idx) => idx !== i)))
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
          onClick={() => setPromos((rows) => [...rows, emptyPromo()])}
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
