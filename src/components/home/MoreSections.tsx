"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { SectionHeading, Button } from "@/components/ui/Button";
import { EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import { BRAND_STORY_BODY, BRAND_TEASER_VALUES } from "@/lib/brand";
import { cn } from "@/lib/utils";

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
          eyebrow={section?.eyebrow ?? "Collection Carousel"}
          title={section?.title ?? "Move through the house."}
          subtitle={
            section?.subtitle ?? "Scroll the page — or drag sideways to browse every look."
          }
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

  return (
    <section className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Categories"}
          title={section?.title ?? "Find your silhouette."}
          subtitle={section?.subtitle ?? undefined}
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {categories.map((cat, i) => {
            const img =
              cat.image_url || products[i * 2]?.images[0] || products[0]?.images[0] || "";
            return (
              <ScrollReveal key={cat.slug} y={48} delay={i * 80}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="group relative flex min-h-[280px] items-end overflow-hidden bg-white p-8 sm:min-h-[340px]"
                  {...cursor}
                >
                  {img && (
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20" />
                  <div className="relative z-10">
                    <p className="font-display text-[10px] tracking-[0.3em] text-mkos-muted uppercase">
                      0{i + 1}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
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
  const paragraphs = body.split("\n\n").filter(Boolean);
  const cmsValues = section?.extra?.values as { title: string; text: string }[] | undefined;
  const values =
    cmsValues?.some((v) => /Mastery|Authenticity|Own It/i.test(v.title)) ?
      cmsValues
    : BRAND_TEASER_VALUES;

  return (
    <section id="story" className="relative overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1600px] gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <ScrollReveal y={40} className="relative aspect-[3/4] overflow-hidden bg-mkos-warm sm:aspect-[4/5]">
          <Image
            src={section?.media_url ?? "/images/products/abeni-boubou.jpg"}
            alt="MKoS brand"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </ScrollReveal>
        <div>
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              {section?.eyebrow ?? "About MKoS"}
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={60}>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
              {section?.title ?? "My Kind of Style."}
            </h2>
          </ScrollReveal>
          <ScrollReveal y={20} delay={100}>
            <p className="mt-4 font-display text-sm tracking-[0.12em] text-mkos-accent uppercase">
              For Those Who Understand STYLE.
            </p>
          </ScrollReveal>
          {paragraphs.slice(0, 2).map((p, i) => (
            <ScrollReveal key={p.slice(0, 24)} y={24} delay={120 + i * 60}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-mkos-muted sm:mt-6 sm:text-lg">
                {p}
              </p>
            </ScrollReveal>
          ))}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <ScrollReveal key={v.title} y={24} delay={i * 70}>
                <p className="font-display text-[11px] tracking-[0.22em] text-mkos-accent uppercase">
                  {v.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mkos-muted">{v.text}</p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal y={20} delay={200} className="mt-10 flex flex-wrap gap-3">
            <Button href="/about" variant="secondary">
              The MASTER Standard
            </Button>
            <Button href={section?.cta_href ?? "/shop"} variant="ghost">
              {section?.cta_label ?? "Explore the shop"}
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
    <section className="bg-mkos-ink px-5 py-28 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Client Voices"}
          title={section?.title ?? "Whispers from the wardrobe."}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r, i) => (
            <ScrollReveal key={r.id} y={28} delay={i * 70} as="div">
              <blockquote className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex gap-1 text-orange-300">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/80">&ldquo;{r.text}&rdquo;</p>
                <footer className="mt-6">
                  <p className="font-display text-sm">{r.name}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {r.location} · {r.product}
                  </p>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InstagramGallery() {
  const { products } = useCms();
  const section = useContent("instagram");
  const gallery = (section?.extra?.gallery as string[] | undefined)?.filter(Boolean);
  const images =
    gallery && gallery.length > 0
      ? gallery
      : products
          .slice(0, 6)
          .map((p) => p.images[0])
          .filter(Boolean);
  const cursor = useCursorLabel("VIEW");

  return (
    <section className="bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={section?.eyebrow ?? "@mkos"}
            title={section?.title ?? "Life in the edit."}
            subtitle={section?.subtitle ?? undefined}
          />
          <Button
            href={section?.cta_href ?? "https://www.instagram.com/shopmykindofstyle"}
            variant="secondary"
          >
            {section?.cta_label ?? "Follow"}
          </Button>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((src, i) => (
            <ScrollReveal key={src} y={24} delay={i * 50}>
              <a
                href={section?.cta_href ?? "https://www.instagram.com/shopmykindofstyle"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-mkos-warm"
                {...cursor}
              >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-orange-950/0 transition-colors duration-500 group-hover:bg-orange-950/25" />
              </a>
            </ScrollReveal>
          ))}
        </div>
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
  const text = section?.body ?? "MKoS · QUIET LUXURY · ATELIER · ESSENTIAL · ";
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
