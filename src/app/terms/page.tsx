import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & conditions",
  description: "Terms and conditions for shopping and commissioning with MKoS.",
  path: "/terms",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <main className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[820px] px-5 sm:px-8 lg:px-12">
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Terms & conditions
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-mkos-muted">
          These terms govern purchases, bespoke and bridal commissions, and use of the MKoS
          website. By placing an order or submitting a brief, you agree to them.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-mkos-ink/85">
          <section>
            <h2 className="font-display text-2xl tracking-tight">Orders</h2>
            <p className="mt-3">
              Product prices at checkout do not include delivery. Pickup, home delivery, and
              international shipping fees are quoted separately and paid before dispatch. Orders
              are confirmed once payment is received.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Made-to-order pieces</h2>
            <p className="mt-3">
              Bespoke, custom, and bridal pieces are created to your brief. They cannot be
              cancelled, returned, or exchanged once production has begun, except where required
              by law.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Ready-to-Wear</h2>
            <p className="mt-3">
              Eligible Ready-to-Wear may be returned or exchanged within 7 days of delivery if unused
              and in original condition, subject to studio inspection and stock.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Studio</h2>
            <p className="mt-3">
              MKoS · 1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos, Nigeria.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
