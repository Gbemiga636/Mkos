"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import { isTouchDevice } from "@/lib/video/autoplay";
import { objectPositionCss } from "@/lib/media/imageFocus";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type HomeCollectionCard = {
  slug: string;
  name: string;
  description: string;
  href: string;
  image: string;
  imageFocus?: { x: number; y: number };
};

/**
 * Homepage collections strip — Women / Men / Bespoke / Bridal.
 * Covers: first Women’s RTW product, first Men’s RTW product; fixed atelier covers for Bespoke & Bridal.
 * Does not rewrite CMS collection rows.
 */
export function FeaturedCollection() {
  const ref = useRef<HTMLElement>(null);
  const cursor = useCursorLabel("EXPLORE");
  const { products, collections } = useCms();
  const section = useContent("featured_collections");

  const cards = useMemo<HomeCollectionCard[]>(() => {
    const firstWomen = products.find(
      (p) => p.category === "women-rtw" && p.images?.[0]
    );
    const firstMen = products.find((p) => p.category === "men-rtw" && p.images?.[0]);
    const bespokeMeta = collections.find((c) => c.slug === "bespoke");
    const bridalMeta = collections.find((c) => c.slug === "bridal");

    return [
      {
        slug: "womens-wear",
        name: "Women’s wear",
        description: "Ready-to-Wear pieces for her — polished, personal, timeless.",
        href: "/shop?collection=ready-to-wear&category=women-rtw",
        image: firstWomen?.images[0] || "/images/products/abeni-boubou.jpg",
        imageFocus: firstWomen?.imageFocus?.[0],
      },
      {
        slug: "mens-wear",
        name: "Men’s wear",
        description: "MKoS Men — contemporary tailoring with cultural presence.",
        href: "/shop?collection=ready-to-wear&category=men-rtw",
        image: firstMen?.images[0] || "/images/products/doja-pants-blue.jpg",
        imageFocus: firstMen?.imageFocus?.[0],
      },
      {
        slug: "bespoke",
        name: "Bespoke",
        description:
          bespokeMeta?.description ||
          "Made for your moment — custom creation with the atelier.",
        href: "/bespoke",
        image: bespokeMeta?.image || "/images/collections/bespoke-cover.jpg",
        imageFocus: bespokeMeta?.imageFocus,
      },
      {
        slug: "bridal",
        name: "Bridal",
        description:
          bridalMeta?.description ||
          "Luxurious bridal designs shaped for your celebration.",
        href: "/bridal",
        image: bridalMeta?.image || "/images/collections/bridal-cover.jpg",
        imageFocus: bridalMeta?.imageFocus ?? { x: 50, y: 28 },
      },
    ];
  }, [products, collections]);

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
  }, [cards.length]);

  const subtitle =
    section?.subtitle &&
    !/Ready-to-Wear\.\s*Bespoke\.\s*Bridal|three ways to experience/i.test(section.subtitle)
      ? section.subtitle
      : "Women’s wear. Men’s wear. Bespoke. Bridal — four ways to experience MKoS, each thoughtfully made for those who understand style.";

  return (
    <section id="collections" ref={ref} className="relative bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Collections"}
          title={section?.title ?? "Designed for Every Defining Moment."}
          subtitle={subtitle}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => {
            const cardClass = "fc-card group relative block overflow-hidden text-left";
            const media = (
              <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                <div className="fc-media fc-media-image absolute inset-0 scale-110">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    style={{ objectPosition: objectPositionCss(c.imageFocus) }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 z-20 p-5 text-white sm:p-6">
                  <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                    {c.name}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-white/70">{c.description}</p>
                </div>
              </div>
            );

            return (
              <ScrollReveal key={c.slug} y={56} delay={i * 80}>
                <Link href={c.href} className={cn(cardClass)} {...cursor}>
                  {media}
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
