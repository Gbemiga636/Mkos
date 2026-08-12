import type { Metadata } from "next";
import Link from "next/link";
import { ShippingConfidence } from "@/components/shipping/ShippingConfidence";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Shipping, duties & returns",
  description:
    "MKoS worldwide shipping, U.S. import duty guidance, returns and exchange policies.",
};

export default function ShippingPage() {
  return (
    <main className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8 lg:px-12">
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Support
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Shipping & returns
        </h1>
        <p className="mt-5 text-base leading-relaxed text-mkos-muted">
          Product totals at checkout never include delivery fees, import duties, or destination
          taxes. Those are communicated or collected separately so you always know what you are
          paying for your MKoS pieces.
        </p>

        <div className="mt-12 space-y-10">
          <section>
            <h2 className="font-display text-2xl tracking-tight">Checkout</h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              All orders are paid securely with Flutterwave in USD — for Nigeria pickup / home
              delivery and for international shipping. Delivery fees are quoted by location before
              dispatch.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">International shipping</h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              Shipping is quoted before your parcel leaves the studio. Duties and taxes in your
              country are not collected by MKoS at checkout.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">U.S. import duty</h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              The U.S. has introduced a 17% import duty on international orders. This duty is
              applied by U.S. customs at delivery and may be collected by your carrier or customs
              broker before the package is released.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Returns & exchanges</h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              Eligible Ready-to-Wear items may be returned or exchanged within 7 days of delivery
              if unused and in original condition, subject to studio inspection and stock
              availability. Bespoke, custom, and bridal pieces are made for you and cannot be
              returned or exchanged.
            </p>
          </section>
        </div>

        <div className="mt-14">
          <ShippingConfidence compact />
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button href="/shop">Shop Ready-to-Wear</Button>
          <Button href="/about#contact" variant="secondary">
            Contact the studio
          </Button>
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center px-2 font-display text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
          >
            Go to checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
