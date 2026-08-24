import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Refund policy",
  description: "MKoS refund, return, and exchange policy for Ready-to-Wear and made-to-order pieces.",
  path: "/refund",
});

export default function RefundPage() {
  return (
    <main className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[820px] px-5 sm:px-8 lg:px-12">
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Refund policy
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-mkos-muted">
          This policy covers refunds, returns, and exchanges for MKoS Ready-to-Wear and
          made-to-order pieces.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-mkos-ink/85">
          <section>
            <h2 className="font-display text-2xl tracking-tight">Ready-to-Wear</h2>
            <p className="mt-3">
              Eligible Ready-to-Wear items may be returned or exchanged within 7 days of delivery
              if unused, unworn, and in original condition, with tags attached. Returns are subject
              to studio inspection and stock availability.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Bespoke, custom & bridal</h2>
            <p className="mt-3">
              Bespoke, custom, and bridal pieces are made for you. They cannot be cancelled,
              returned, or refunded once production has begun, except where required by law.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Delivery fees & duties</h2>
            <p className="mt-3">
              Delivery fees, dispatch charges, and import duties are separate from the product
              price and are not refundable once paid, unless the studio is at fault for a failed
              delivery.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">How to request a refund</h2>
            <p className="mt-3">
              Write to styleme@mykindofstyle.com or message us on WhatsApp with your order
              reference, within 7 days of delivery. Approved refunds are returned to the original
              payment method after inspection.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
