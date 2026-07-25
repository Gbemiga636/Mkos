"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { useContent } from "@/lib/cms/CmsProvider";

gsap.registerPlugin(ScrollTrigger);

export function CampaignSection() {
  const ref = useRef<HTMLElement>(null);
  const campaign = useContent("campaign");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".campaign-copy",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 60%" },
        }
      );

      gsap.to(".campaign-video", {
        scale: 1.12,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".campaign-mask", {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "top 20%",
          scrub: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="campaign" ref={ref} className="relative min-h-[100svh] overflow-hidden bg-mkos-ink">
      <div
        className="campaign-mask absolute inset-0"
        style={{ clipPath: "inset(12% 8% 12% 8%)" }}
      >
        <video
          className="campaign-video h-full w-full scale-110 object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={campaign?.media_url ?? "/videos/cloth-1.mp4"} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="campaign-copy relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 text-center text-white">
        <p className="font-display text-[11px] tracking-[0.4em] text-white/60 uppercase">
          {campaign?.eyebrow}
        </p>
        <h2 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-7xl lg:text-8xl">
          {campaign?.title}
        </h2>
        <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
          {campaign?.subtitle}
        </p>
        <Button
          href={campaign?.cta_href ?? "/shop"}
          variant="outline"
          size="lg"
          className="mt-10"
        >
          {campaign?.cta_label ?? "Shop the film"}
        </Button>
      </div>
    </section>
  );
}
