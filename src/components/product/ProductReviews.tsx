"use client";

import { useEffect, useState } from "react";

type ReviewRow = {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

export function ProductReviews({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/reviews?productId=${encodeURIComponent(productId)}&slug=${encodeURIComponent(productSlug)}`
        );
        const data = await res.json();
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, productSlug]);

  if (!reviews.length) return null;

  return (
    <section className="mx-auto mt-20 max-w-[1600px] px-5 lg:px-12">
      <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Client reviews
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {reviews.map((r) => (
          <article key={r.id} className="border border-mkos-border bg-white p-6">
            <p className="font-display text-sm tracking-wide">
              {"★".repeat(r.rating)}
              <span className="text-mkos-muted">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">{r.text}</p>
            <p className="mt-4 font-display text-[11px] tracking-[0.18em] text-mkos-ink uppercase">
              {r.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
