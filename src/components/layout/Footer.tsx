"use client";

import Link from "next/link";
import { EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { EditableSection } from "@/components/cms/EditableSection";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCms, useContent } from "@/lib/cms/CmsProvider";

const IG_MAIN = "https://www.instagram.com/shopmykindofstyle";
const IG_MEN = "https://www.instagram.com/mkosformen";
const WHATSAPP = "https://wa.me/2348143173661";

export function Footer() {
  const { settings, collections } = useCms();
  const footer = useContent("footer");

  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/shop", label: "All Products" },
        ...collections.map((c) => ({
          href: `/shop?collection=${c.slug}`,
          label: c.name,
        })),
        { href: "/shop?filter=new", label: "New Arrivals" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/#faq", label: "FAQ" },
        { href: "/account", label: "Orders" },
        { href: WHATSAPP, label: "WhatsApp" },
        { href: "mailto:mkosfashionhouse@gmail.com", label: "Email" },
      ],
    },
    {
      title: "House",
      links: [
        { href: "/about", label: "About MKoS" },
        { href: "/experience", label: "MKoS Experience" },
        { href: "/blog", label: "Journal" },
        { href: "/about#contact", label: "Contact" },
        { href: "/shop?collection=men", label: "MKoS Men" },
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
            <ScrollReveal y={16} className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              {footer?.eyebrow ?? "Stay close"}
            </ScrollReveal>
            <ScrollReveal y={24} delay={60} className="mt-4 max-w-xl">
              <h2 className="font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
                {footer?.title ?? "For Those Who Understand STYLE."}
              </h2>
            </ScrollReveal>
            <div className="mt-10 max-w-lg">
              <EmailSubscribe buttonLabel="Join" successLabel="Joined" />
            </div>

            <div className="mt-10 max-w-md space-y-2 text-sm text-mkos-muted">
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-ink uppercase">
                Studio
              </p>
              <p>1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos, Nigeria.</p>
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
          <div>
            <p className="font-display text-6xl font-medium tracking-tighter sm:text-8xl lg:text-[9rem] leading-none">
              {settings.brand_name}
            </p>
            <p className="mt-3 text-sm text-mkos-muted">{settings.tagline}</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex flex-wrap gap-5 text-sm text-mkos-muted">
              <a href={IG_MAIN} target="_blank" rel="noopener noreferrer" className="hover:text-mkos-ink">
                @shopmykindofstyle
              </a>
              <a href={IG_MEN} target="_blank" rel="noopener noreferrer" className="hover:text-mkos-ink">
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
