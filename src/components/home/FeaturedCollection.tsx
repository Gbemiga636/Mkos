"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "@/components/ui/Button";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useCms, useContent } from "@/lib/cms/CmsProvider";

gsap.registerPlugin(ScrollTrigger);

export function FeaturedCollection() {
  const ref = useRef<HTMLElement>(null);
  const cursor = useCursorLabel("EXPLORE");
  const { collections } = useCms();
  const section = useContent("featured_collections");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fc-card",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
          },
        }
      );

      gsap.to(".fc-media", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Featured Collections"}
          title={section?.title ?? "Three chapters. One language."}
          subtitle={section?.subtitle ?? undefined}
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => (
            <Link
              key={c.slug}
              href={`/shop?collection=${c.slug}`}
              className="fc-card group relative block overflow-hidden"
              style={{ marginTop: i === 1 ? "3rem" : i === 2 ? "1.5rem" : 0 }}
              {...cursor}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                <div className="fc-media absolute inset-0 scale-110">
                  {c.video ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    >
                      <source src={c.video} type="video/mp4" />
                    </video>
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
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="font-display text-[10px] tracking-[0.3em] text-white/60 uppercase">
                    0{i + 1}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {c.name}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-white/70">{c.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
