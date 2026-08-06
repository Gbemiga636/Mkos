"use client";

import Image from "next/image";
import Link from "next/link";
import { EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { EditableSection } from "@/components/cms/EditableSection";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCms } from "@/lib/cms/CmsProvider";

const IG_MAIN = "https://www.instagram.com/shopmykindofstyle";
const IG_MEN = "https://www.instagram.com/mkosformen";
const WHATSAPP = "https://wa.me/2348143173661";
const STUDIO_ADDRESS = "1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos, Nigeria.";
const STUDIO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADDRESS)}`;

export function Footer() {
  const { settings } = useCms();

  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/shop", label: "All Products" },
        { href: "/shop?collection=ready-to-wear", label: "Ready-to-Wear" },
        { href: "/bespoke", label: "Bespoke / Custom Wear" },
        { href: "/bridal", label: "Bridal" },
        { href: "/shop?filter=new", label: "New Arrivals" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/#faq", label: "FAQ" },
        { href: "/shipping", label: "Shipping & returns" },
        { href: WHATSAPP, label: "WhatsApp" },
        { href: "mailto:mkosfashionhouse@gmail.com", label: "Email" },
      ],
    },
    {
      title: "House",
      links: [
        { href: "/about", label: "About MKoS" },
        { href: "/experience", label: "MKoS Experience" },
        { href: "/bespoke", label: "Bespoke / Custom Wear" },
        { href: "/bridal", label: "Bridal" },
        { href: "/blog", label: "Journal" },
        { href: "/about#contact", label: "Contact" },
        { href: "/shop?collection=ready-to-wear&category=men-rtw", label: "MKoS Men" },
        { href: IG_MAIN, label: "Instagram" },
      ],
    },
  ];

  return (
    <EditableSection cmsKey="footer" label="Footer">
    <footer className="relative overflow-hidden border-t border-mkos-border bg-mkos-warm">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,92,38,0.1),transparent_70%)]" />

      <div className="mx-auto max-w-[1600px] px-5 pt-24 pb-10 sm:px-8 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <ScrollReveal y={16} className="mt-2 max-w-lg">
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                Subscribe for new updates
              </p>
              <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-mkos-ink sm:text-3xl">
                Join for new looks & updates from MKoS
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mkos-muted sm:text-base">
                Be first to hear about studio drops, fittings, and fresh Ready-to-Wear from the
                house.
              </p>
              <div className="mt-6">
                <EmailSubscribe buttonLabel="Join" successLabel="Joined" source="footer" />
              </div>
            </ScrollReveal>

            <div className="mt-10 max-w-md space-y-3 text-sm text-mkos-muted">
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-ink uppercase">
                Studio
              </p>
              <a
                href={STUDIO_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex max-w-full items-start gap-3 border border-mkos-border bg-white px-4 py-3 text-left transition-colors hover:border-mkos-ink"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border border-mkos-border font-display text-[10px] tracking-[0.14em] text-mkos-ink uppercase transition-colors group-hover:bg-mkos-ink group-hover:text-white"
                  aria-hidden
                >
                  Map
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-relaxed text-mkos-ink">{STUDIO_ADDRESS}</span>
                  <span className="mt-1 block font-display text-[10px] tracking-[0.18em] text-mkos-accent uppercase">
                    Open in Google Maps
                  </span>
                </span>
              </a>
              <p>
                <a href="mailto:mkosfashionhouse@gmail.com" className="hover:text-mkos-ink">
                  mkosfashionhouse@gmail.com
                </a>
              </p>
              <p>
                WhatsApp:{" "}
                <a href={WHATSAPP} className="hover:text-mkos-ink">
                  08143173661
                </a>
                {" · "}
                <a href="https://wa.me/2348104643052" className="hover:text-mkos-ink">
                  08104643052
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                  {col.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-mkos-ink/80 transition-colors hover:text-mkos-ink"
                        {...(l.href.startsWith("http") || l.href.startsWith("mailto")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-8 border-t border-mkos-border pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Image
              src="/images/brand/mkos-signature.jpg"
              alt="My Kind of Style"
              width={720}
              height={180}
              className="h-auto w-full max-w-[min(100%,28rem)] object-contain object-left mix-blend-multiply sm:max-w-[36rem]"
              priority={false}
            />
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex flex-wrap gap-3">
              <a
                href={IG_MAIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-mkos-border bg-white px-4 py-2.5 font-display text-[11px] tracking-[0.16em] text-mkos-ink uppercase transition-colors hover:border-mkos-ink hover:bg-mkos-ink hover:text-white"
              >
                @shopmykindofstyle
              </a>
              <a
                href={IG_MEN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-mkos-border bg-white px-4 py-2.5 font-display text-[11px] tracking-[0.16em] text-mkos-ink uppercase transition-colors hover:border-mkos-ink hover:bg-mkos-ink hover:text-white"
              >
                @mkosformen
              </a>
            </div>
            <p className="text-xs text-mkos-muted">
              © {new Date().getFullYear()} {settings.brand_name} · My Kind of Style. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
    </EditableSection>
  );
}
