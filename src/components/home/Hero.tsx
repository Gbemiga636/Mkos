"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useUIStore } from "@/store/ui";
import { useContent } from "@/lib/cms/CmsProvider";

function useTypewriter(text: string, active: boolean, msPerChar = 55) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setCount(0);
      setDone(false);
      return;
    }

    setCount(0);
    setDone(false);
    let i = 0;
    let timer = 0;

    const tick = () => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        setDone(true);
        return;
      }
      // Slight pause after punctuation / line breaks
      const ch = text[i - 1];
      const pause = ch === "\n" ? 280 : /[,.—–-]/.test(ch) ? 140 : msPerChar;
      timer = window.setTimeout(tick, pause);
    };

    timer = window.setTimeout(tick, 220);
    return () => window.clearTimeout(timer);
  }, [active, text, msPerChar]);

  return { typed: text.slice(0, count), done, count };
}

export function Hero() {
  const ready = useUIStore((s) => s.loaderComplete);
  const hero = useContent("hero");
  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const layer1x = useTransform(sx, (v) => v * 0.02);
  const layer1y = useTransform(sy, (v) => v * 0.02);
  const layer2x = useTransform(sx, (v) => v * -0.03);
  const layer2y = useTransform(sy, (v) => v * -0.025);
  const playCursor = useCursorLabel("EXPLORE");

  const fullTitle = hero?.title ?? "Silence,\ntailored.";
  const { typed, done: typedDone } = useTypewriter(fullTitle, ready, 58);
  const typedLines = useMemo(() => typed.split("\n"), [typed]);

  const secondaryLabel = String(hero?.extra?.secondary_cta_label ?? "Watch campaign");
  const secondaryHref = String(hero?.extra?.secondary_cta_href ?? "/about");
  const videoSrc = hero?.media_url ?? "/videos/hero-bg.mp4";

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX - window.innerWidth / 2);
      my.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-mkos-ink text-white"
      {...playCursor}
    >
      <motion.div className="absolute inset-0 bg-black" style={{ x: layer1x, y: layer1y, scale: 1.08 }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover opacity-80"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]" />

      <motion.div
        className="pointer-events-none absolute top-[18%] right-[12%] h-40 w-40 rounded-full border border-white/10"
        style={{ x: layer2x, y: layer2y }}
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[30%] left-[8%] h-24 w-24 rounded-full bg-orange-600/20 blur-2xl"
        animate={{ y: [0, -18, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Keeps copy clear of the fixed header */}
      <div className="pointer-events-none relative z-10 min-h-[34vh] shrink-0 sm:min-h-[38vh]" aria-hidden />

      <div className="relative z-10 mx-auto mt-auto w-full max-w-[1600px] px-5 pb-14 pt-6 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <div className="max-w-4xl">
          {/* Eyebrow — slides up from below */}
          <motion.p
            initial={{ opacity: 0, y: 36 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[11px] tracking-[0.4em] text-white/60 uppercase"
          >
            {hero?.eyebrow ? <BrandText>{hero.eyebrow}</BrandText> : null}
          </motion.p>

          {/* Headline — typewriter */}
          <h1
            className="mt-5 min-h-[1.1em] font-display text-4xl leading-[0.95] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-[6.75rem]"
            aria-label={fullTitle.replace(/\n/g, " ")}
          >
            {typedLines.map((line, i) => (
              <span key={`line-${i}`}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
            <motion.span
              aria-hidden
              className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] bg-white align-baseline"
              initial={{ opacity: 0 }}
              animate={
                !ready
                  ? { opacity: 0 }
                  : typedDone
                    ? { opacity: 0 }
                    : { opacity: [1, 0.12, 1] }
              }
              transition={
                typedDone
                  ? { duration: 0.35, ease: "easeOut" }
                  : { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </h1>

          {/* Subtitle — slides up after type finishes */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={typedDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg"
          >
            {hero?.subtitle}
          </motion.p>

          {/* CTAs — slide up shortly after subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={typedDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button href={hero?.cta_href ?? "/shop"} variant="outline" size="lg" cursor="SHOP">
              {hero?.cta_label ?? "Enter the shop"}
            </Button>
            <Button
              href={secondaryHref}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
              cursor="EXPLORE"
            >
              {secondaryLabel}
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={typedDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-16 flex items-center gap-3 font-display text-[10px] tracking-[0.35em] text-white/50 uppercase"
        >
          <span className="relative flex h-8 w-5 items-start justify-center rounded-full border border-white/30 pt-1.5">
            <motion.span
              className="h-1.5 w-px bg-white"
              animate={typedDone ? { y: [0, 10, 0], opacity: [1, 0.2, 1] } : {}}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </span>
          Scroll to discover
        </motion.div>
      </div>
    </section>
  );
}
