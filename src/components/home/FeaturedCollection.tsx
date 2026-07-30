"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "@/components/ui/Button";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import { isTouchDevice } from "@/lib/video/autoplay";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

function collectionHref(slug: string) {
  if (slug === "bespoke") return "/bespoke";
  if (slug === "ready-to-wear") return "/shop?collection=ready-to-wear";
  return null;
}

export function FeaturedCollection() {
  const ref = useRef<HTMLElement>(null);
  const cursor = useCursorLabel("EXPLORE");
  const { collections } = useCms();
  const section = useContent("featured_collections");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (isTouchDevice()) return;

    const ctx = gsap.context(() => {
      gsap.to(".fc-media-image", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }, el);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [collections.length]);

  return (
    <section id="collections" ref={ref} className="relative bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Collections"}
          title={section?.title ?? "Designed for Every Defining Moment."}
          subtitle={
            section?.subtitle ??
            "Ready-to-Wear. Bespoke. Bridal — three ways to experience MKoS: discover timeless Ready-to-Wear, expertly crafted Bespoke creations, and luxurious Bridal designs, each thoughtfully made for those who understand style."
          }
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => {
            const href = collectionHref(c.slug);
            const isBridal = c.slug === "bridal";
            const cardClass = cn(
              "fc-card group relative block overflow-hidden text-left",
              isBridal && "cursor-default"
            );
            const media = (
              <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                <div
                  className={
                    c.video
                      ? "absolute inset-0"
                      : "fc-media fc-media-image absolute inset-0 scale-110"
                  }
                >
                  {c.video ? (
                    <AutoplayVideo src={c.video} className="h-full w-full object-cover" />
                  ) : (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {isBridal && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/72 px-6 text-center backdrop-blur-[2px]">
                    <p className="font-display text-[11px] tracking-[0.4em] text-mkos-accent uppercase sm:text-xs">
                      Bridal
                    </p>
                    <p className="mt-4 font-display text-3xl font-medium tracking-[0.2em] text-white uppercase sm:text-4xl lg:text-5xl">
                      Coming soon
                    </p>
                    <p className="mt-4 max-w-[14rem] text-sm leading-relaxed text-white/75">
                      Luxurious bridal designs are being prepared for the house.
                    </p>
                  </div>
                )}

                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 p-6 text-white sm:p-8",
                    isBridal ? "z-[5]" : "z-20"
                  )}
                >
                  <h3 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {c.name}
                  </h3>
                  {!isBridal && (
                    <p className="mt-2 max-w-xs text-sm text-white/70">{c.description}</p>
                  )}
                </div>
              </div>
            );

            return (
              <ScrollReveal key={c.slug} y={56} delay={i * 100}>
                {href ? (
                  <Link href={href} className={cardClass} {...cursor}>
                    {media}
                  </Link>
                ) : (
                  <div
                    className={cardClass}
                    role="status"
                    aria-label={`${c.name} — coming soon`}
                    {...(isBridal ? {} : cursor)}
                  >
                    {media}
                  </div>
                )}
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
