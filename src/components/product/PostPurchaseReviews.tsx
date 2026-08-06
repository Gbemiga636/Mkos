"use client";

import { useState } from "react";

type Item = {
  productId?: string | null;
  slug?: string | null;
  name: string;
};

export function PostPurchaseReviews({
  reference,
  email,
  items,
}: {
  reference: string;
  email?: string | null;
  items: Item[];
}) {
  const unique = items.filter((i) => i.productId || i.slug);
  const [active, setActive] = useState(0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  if (!unique.length || !reference) return null;
  const item = unique[Math.min(active, unique.length - 1)];
  const key = `${item.productId || ""}:${item.slug || ""}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (doneIds.includes(key)) {
      setMsg("You already reviewed this piece for this order.");
      return;
    }
    setSending(true);
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          productId: item.productId,
          productSlug: item.slug,
          name,
          email: email || "",
          rating,
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save review");
        return;
      }
      setDoneIds((prev) => [...prev, key]);
      setText("");
      setMsg("Thank you — your review is live on the product page.");
      if (active < unique.length - 1) setActive((a) => a + 1);
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-14 border border-mkos-border bg-white p-6 sm:p-8">
      <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
        After your purchase
      </p>
      <h2 className="mt-3 font-display text-2xl font-medium tracking-tight">
        Leave a client review
      </h2>
      <p className="mt-2 text-sm text-mkos-muted">
        Share how your MKoS piece feels and fits — it helps the next client choose with confidence.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {unique.map((it, i) => (
          <button
            key={`${it.productId}-${it.slug}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={`h-9 border px-3 font-display text-[10px] tracking-[0.14em] uppercase ${
              i === active ? "border-mkos-ink bg-mkos-ink text-white" : "border-mkos-border"
            }`}
          >
            {it.name}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Your name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none"
          />
        </label>
        <div>
          <p className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Rating
          </p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`h-10 w-10 border font-display text-sm ${
                  rating >= n ? "border-mkos-ink bg-mkos-ink text-white" : "border-mkos-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
            Your review of {item.name}
          </span>
          <textarea
            required
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5 w-full border border-mkos-border px-3 py-2 text-sm outline-none"
            placeholder="Fit, fabric, occasion, how it made you feel…"
          />
        </label>
        <button
          type="submit"
          disabled={sending || doneIds.includes(key)}
          className="h-12 bg-mkos-ink px-6 font-display text-[11px] tracking-[0.18em] text-white uppercase disabled:opacity-50"
        >
          {doneIds.includes(key) ? "Reviewed" : sending ? "Sending…" : "Submit review"}
        </button>
        {msg ? <p className="text-sm text-mkos-accent">{msg}</p> : null}
      </form>
    </section>
  );
}
