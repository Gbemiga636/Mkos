import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "How MKoS collects and uses personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[820px] px-5 sm:px-8 lg:px-12">
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-mkos-muted">
          This policy explains how MKoS handles personal information when you shop, commission a
          piece, join our list, or contact the studio.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-mkos-ink/85">
          <section>
            <h2 className="font-display text-2xl tracking-tight">What we collect</h2>
            <p className="mt-3">
              We collect details you share with us — name, email, phone, delivery address, order
              notes, and brief information — so we can fulfil orders, schedule fittings, and
              reply to you.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">How we use it</h2>
            <p className="mt-3">
              We use this information to process payments, deliver pieces, send order updates, and
              — if you join our list — studio news. We do not sell your information.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Payments</h2>
            <p className="mt-3">
              Card payments are processed by Flutterwave. We do not store full card numbers on
              our servers.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-tight">Contact</h2>
            <p className="mt-3">
              Questions about your data: styleme@mykindofstyle.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
