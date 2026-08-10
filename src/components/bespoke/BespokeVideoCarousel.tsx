"use client";

import { useEffect, useRef, useState } from "react";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { cn } from "@/lib/utils";

const SLIDES = [
  "/videos/bespoke-caro-1.mp4",
  "/videos/bespoke-caro-2.mp4",
] as const;

/**
 * Text-only bespoke film carousel — horizontal snap scroll before footer subscribe.
 * Hard-coded paths only; does not touch CMS media.
 */
export function BespokeVideoCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setActive(Math.max(0, Math.min(SLIDES.length - 1, i)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section
      aria-label="Bespoke films"
      className="relative overflow-hidden bg-mkos-ink"
    >
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((src, i) => (
          <div
            key={src}
            className="relative h-[min(78svh,640px)] w-full shrink-0 snap-center sm:h-[min(82svh,720px)]"
          >
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-[1200ms] ease-out",
                active === i ? "scale-100" : "scale-[1.06]"
              )}
            >
              <AutoplayVideo
                src={src}
                className="h-full w-full object-cover"
                whenVisible
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.45)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/35 to-transparent sm:w-16" />

      <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2.5 sm:bottom-8">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Film ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              active === i ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous film"
        onClick={() => goTo(Math.max(0, active - 1))}
        className="absolute top-1/2 left-3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:flex"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next film"
        onClick={() => goTo(Math.min(SLIDES.length - 1, active + 1))}
        className="absolute top-1/2 right-3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:flex"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
