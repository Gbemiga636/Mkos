"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { SectionHeading, Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import { BRAND_STORY_BODY } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { RTW_CATEGORY_SLUGS } from "@/data/products";

export function CollectionCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const userControlRef = useRef(false);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startScroll: number; moved: boolean }>({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const [dragging, setDragging] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const cursor = useCursorLabel("DRAG");
  const { carousel } = useCms();
  const section = useContent("carousel");

  const slides = carousel.map((s) => ({
    src: s.image_url,
    name: s.name,
    href: s.href ?? "/shop",
  }));

  const syncingRef = useRef(false);

  const claimManual = useCallback(() => {
    if (syncingRef.current) return;
    userControlRef.current = true;
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = setTimeout(() => {
      userControlRef.current = false;
    }, 2200);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const el = scrollerRef.current;
    if (!el || userControlRef.current || dragRef.current.active) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    // Map mid-range of section travel so the strip moves while it's on screen
    const t = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
    syncingRef.current = true;
    el.scrollLeft = t * max;
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  });

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    setDragging(true);
    userControlRef.current = true;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag.active || !el) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    el.scrollLeft = drag.startScroll - dx;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    setDragging(false);
    if (moved) claimManual();
    else userControlRef.current = false;
  }

  return (
    <section ref={sectionRef} className="bg-white py-28">
      <div className="px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Lookbook"}
          title={section?.title ?? "Move through the house."}
          subtitle={
            section?.subtitle ?? "Scroll the page — or drag sideways to browse every look."
          }
          accentEyebrow
        />
      </div>
      <div
        ref={scrollerRef}
        data-lenis-prevent
        onScroll={claimManual}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) claimManual();
        }}
        className={cn(
          "mt-14 flex cursor-grab gap-6 overflow-x-auto overscroll-x-contain px-5 pb-4 sm:px-8",
          "snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin]",
          "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-mkos-ink/25 [&::-webkit-scrollbar-track]:bg-transparent",
          dragging && "cursor-grabbing scroll-auto select-none"
        )}
        {...cursor}
      >
        {slides.map((c, i) => (
          <ScrollReveal key={`${c.name}-${i}`} y={40} delay={i * 40} className="snap-start shrink-0">
            <Link
              href={c.href}
              draggable={false}
              onClick={(e) => {
                if (dragRef.current.moved) e.preventDefault();
              }}
              className="relative block h-[420px] w-[min(80vw,320px)] overflow-hidden sm:h-[520px] sm:w-[400px]"
            >
              <Image
                src={c.src}
                alt={c.name}
                fill
                draggable={false}
                className="pointer-events-none object-cover"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white">
                <p className="font-display text-2xl">{c.name}</p>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

export function CategoryGrid() {
  const cursor = useCursorLabel("VIEW");
  const { categories, products } = useCms();
  const section = useContent("categories");
  const rtwCategories = categories.filter((c) =>
    (RTW_CATEGORY_SLUGS as readonly string[]).includes(c.slug)
  );

  return (
    <section className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Categories"}
          title={section?.title ?? "Find your silhouette."}
          subtitle={section?.subtitle ?? undefined}
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rtwCategories.map((cat, i) => {
            const img =
              cat.image_url ||
              products.find((p) => p.category === cat.slug)?.images?.[0] ||
              products[0]?.images[0] ||
              "";
            return (
              <ScrollReveal key={cat.slug} y={48} delay={i * 80}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="group relative flex min-h-[240px] items-end overflow-hidden bg-white p-6 sm:min-h-[300px] sm:p-7 lg:min-h-[340px] lg:p-8"
                  {...cursor}
                >
                  {img && (
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20" />
                  <div className="relative z-10">
                    <h3 className="font-display text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
                      {cat.name}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-mkos-muted">{cat.description}</p>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  const section = useContent("brand_story");
  const rawBody = section?.body ?? "";
  const body = /MASTER|Mastery/i.test(rawBody) ? rawBody : BRAND_STORY_BODY;
  const firstParagraph = body.split("\n\n").filter(Boolean)[0] ?? "";
  // Homepage teaser: end at “authenticity” — full story lives on /about
  const authenticityMatch = firstParagraph.match(/^([\s\S]*?\bauthenticity\b[^.]*\.?)/i);
  const teaser =
    authenticityMatch?.[1]?.trim() ||
    firstParagraph.trim() ||
    "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.";

  return (
    <section id="story" className="relative overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="max-w-2xl">
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
              <BrandText>{section?.eyebrow ?? "About MKoS"}</BrandText>
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={60}>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
              {section?.title ?? "My Kind of Style."}
            </h2>
          </ScrollReveal>
          <ScrollReveal y={20} delay={100}>
            <p className="mt-4 font-display text-sm tracking-[0.12em] text-mkos-ink uppercase">
              For Those Who Understand STYLE.
            </p>
          </ScrollReveal>
          <ScrollReveal y={24} delay={120}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-mkos-muted sm:mt-6 sm:text-lg">
              {teaser}
            </p>
          </ScrollReveal>
          <ScrollReveal y={20} delay={200} className="mt-10">
            <Button href="/about" variant="secondary">
              Read more
            </Button>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  const { reviews } = useCms();
  const section = useContent("reviews");

  return (
    <section className="relative overflow-hidden bg-mkos-ink px-5 py-28 text-white sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,92,38,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Love notes"}
          title={section?.title ?? "From the MKoS feed."}
          tone="dark"
        />
        <p className="mt-4 max-w-xl text-sm text-white/55 sm:text-base">
          Real comments. Real clients. Real My Kind of Style moments ✨
        </p>

        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {reviews.map((r, i) => (
            <ScrollReveal
              key={r.id}
              y={28}
              delay={i * 60}
              as="div"
              className="mb-5 break-inside-avoid"
            >
              <blockquote className="relative overflow-hidden border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-0.5 text-mkos-accent-light">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <span key={j} className="text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="font-display text-[9px] tracking-[0.2em] text-white/35 uppercase">
                    IG
                  </span>
                </div>

                <p className="mt-5 text-[15px] leading-relaxed text-white/90">
                  <span className="mr-1 text-mkos-accent-light">“</span>
                  {r.text}
                  <span className="ml-1 text-mkos-accent-light">”</span>
                </p>

                <footer className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mkos-accent/25 font-display text-[11px] text-mkos-accent-light">
                    {(r.name.replace(/^@/, "").slice(0, 1) || "M").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm tracking-tight">{r.name}</p>
                    <p className="mt-0.5 truncate text-xs text-white/45">
                      {r.location === r.product || !r.product
                        ? r.location
                        : `${r.location} · ${r.product}`}
                    </p>
                  </div>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const IG_MAIN = "https://www.instagram.com/shopmykindofstyle";
const IG_MEN = "https://www.instagram.com/mkosformen";

export function InstagramGallery() {
  const section = useContent("instagram");
  const { settings } = useCms();
  const mainHref = settings.social?.instagram || section?.cta_href || IG_MAIN;
  const menHref = settings.social?.men || IG_MEN;

  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <ScrollReveal y={16}>
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
            <BrandText>{section?.eyebrow ?? "Follow MKoS"}</BrandText>
          </p>
        </ScrollReveal>
        <ScrollReveal y={20} delay={60} className="flex flex-wrap gap-3">
          <Button href={mainHref} variant="secondary">
            Follow on Instagram
          </Button>
          <Button href={menHref} variant="secondary">
            Follow MKoS Men
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function Newsletter() {
  const { newsletter } = useCms();

  return (
    <section className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12">
      <div className="absolute inset-0 gradient-purple opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
      <div className="relative mx-auto max-w-xl text-center text-white">
        <ScrollReveal y={28}>
          <p className="font-display text-[11px] tracking-[0.35em] text-white/60 uppercase">
            {newsletter.eyebrow}
          </p>
        </ScrollReveal>
        <ScrollReveal y={40} delay={80}>
          <h2 className="mt-5 font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
            {newsletter.title}
          </h2>
        </ScrollReveal>
        <ScrollReveal y={28} delay={140}>
          <p className="mt-4 text-white/70">{newsletter.subtitle}</p>
        </ScrollReveal>
        <ScrollReveal y={24} delay={200} className="mt-10 text-left">
          <EmailSubscribe
            variant="dark"
            buttonLabel={newsletter.button_label}
            successLabel="Welcome"
            source="newsletter"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

export function FAQ() {
  const { faqs } = useCms();
  const section = useContent("faq");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "FAQ"}
          title={section?.title ?? "Answers, quietly delivered."}
          subtitle={section?.subtitle ?? undefined}
        />
        <div className="divide-y divide-mkos-border border-y border-mkos-border">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <ScrollReveal key={item.q} y={24} delay={i * 60}>
                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-6 text-left"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-lg sm:text-xl">{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      className="text-2xl leading-none"
                    >
                      +
                    </motion.span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-sm leading-relaxed text-mkos-muted sm:text-base">
                      {item.a}
                    </p>
                  </motion.div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const section = useContent("marquee");
  const text =
    section?.body ??
    "MKoS · MY KIND OF STYLE · FOR THOSE WHO UNDERSTAND STYLE · MKoS MASTER STANDARD · ";
  return (
    <div className="overflow-hidden border-y border-mkos-border bg-white py-4">
      <motion.div
        className="flex whitespace-nowrap font-display text-sm tracking-[0.35em] text-mkos-muted"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <span>{text.repeat(8)}</span>
        <span>{text.repeat(8)}</span>
      </motion.div>
    </div>
  );
}
