"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "/videos/bespoke-caro-1.mp4",
    poster: "/videos/bespoke-caro-1.jpg",
  },
  {
    src: "/videos/bespoke-caro-2.mp4",
    poster: "/videos/bespoke-caro-2.jpg",
  },
] as const;

function FilmSlide({
  src,
  poster,
  active,
}: {
  src: string;
  poster: string;
  active: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const wrap = wrapRef.current;
    if (!wrap) return;

    const video = wrap.querySelector("video");
    if (!video) return;

    const markReady = () => {
      if (video.readyState >= 2 || (!video.paused && video.currentTime > 0.05)) {
        setReady(true);
      }
    };

    if (video.readyState >= 2) markReady();

    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("playing", markReady);
    return () => {
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("playing", markReady);
    };
  }, [src]);

  return (
    <div className="relative h-[min(78svh,640px)] w-full shrink-0 snap-center sm:h-[min(82svh,720px)]">
      <div
        ref={wrapRef}
        className={cn(
          "absolute inset-0 transition-transform duration-[1200ms] ease-out",
          active ? "scale-100" : "scale-[1.06]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            ready ? "opacity-0" : "opacity-100"
          )}
        />
        <AutoplayVideo
          src={src}
          poster={poster}
          preload="metadata"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            ready ? "opacity-100" : "opacity-0"
          )}
          whenVisible
        />
      </div>

      {!ready ? (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/25">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
          <span className="sr-only">Loading film</span>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.45)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
    </div>
  );
}

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
    <section aria-label="Bespoke films" className="relative overflow-hidden bg-mkos-ink">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, i) => (
          <FilmSlide key={slide.src} src={slide.src} poster={slide.poster} active={active === i} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/35 to-transparent sm:w-16" />

      <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2.5 sm:bottom-8">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
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
