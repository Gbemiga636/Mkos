"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/experience/ScrollReveal";

const pillars = [
  {
    title: "Worldwide shipping",
    body: "We ship from Lagos to clients across Africa and internationally. Delivery fees are quoted before dispatch and paid separately from your product total.",
  },
  {
    title: "Duties & taxes",
    body: "Import duties and local taxes may apply in your destination country and are collected by customs at delivery — not included in your MKoS checkout total. U.S. orders may attract a 17% import duty.",
  },
  {
    title: "Returns",
    body: "Ready-to-Wear pieces in original condition may be eligible for return within 7 days of delivery, subject to inspection. Custom, bespoke, and bridal pieces are made to order and are non-returnable.",
  },
  {
    title: "Exchanges",
    body: "Size exchanges on eligible Ready-to-Wear items are available where stock allows. Contact the studio within 7 days with your order reference and preferred size.",
  },
];

export function ShippingConfidence({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="shipping-confidence"
      className={
        compact
          ? "border border-mkos-border bg-white p-5"
          : "border-y border-mkos-border bg-mkos-warm px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      }
    >
      <div className={compact ? "" : "mx-auto max-w-[1600px]"}>
        <ScrollReveal y={20}>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Shipping confidence
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Clear delivery, duties, returns & exchanges.
          </h2>
          {!compact ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mkos-muted sm:text-base">
              Shop with clarity — whether you are collecting in Oniru or receiving a parcel
              worldwide.
            </p>
          ) : null}
        </ScrollReveal>

        <div
          className={
            compact
              ? "mt-6 grid gap-5 sm:grid-cols-2"
              : "mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
          {pillars.map((p, i) => (
            <ScrollReveal key={p.title} y={28} delay={i * 60}>
              <div className="border-t border-mkos-border pt-5">
                <h3 className="font-display text-lg tracking-tight">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mkos-muted">{p.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {!compact ? (
          <ScrollReveal y={16} className="mt-10">
            <Link
              href="/shipping"
              className="font-display text-[11px] tracking-[0.2em] text-mkos-ink uppercase underline-offset-4 hover:underline"
            >
              Full shipping & returns guide
            </Link>
          </ScrollReveal>
        ) : null}
      </div>
    </section>
  );
}
