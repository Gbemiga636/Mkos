"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    brand_name: "MKoS",
    tagline: "",
    logo_url: "",
    currency: "NGN",
    instagram: "",
    whatsapp: "",
  });
  const [status, setStatus] = useState("");

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
    </div>
  );
}
