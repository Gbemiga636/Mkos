"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { useUIStore } from "@/store/ui";
import { useCmsOptional } from "@/lib/cms/CmsProvider";
import { BRAND_NAME, normalizeBrandText } from "@/lib/brand";
import { notifyLoaderComplete } from "@/lib/video/autoplay";

export function IntroLoader() {
  const setLoaderComplete = useUIStore((s) => s.setLoaderComplete);
  const cms = useCmsOptional();
  const logoSrc = cms?.settings.logo_url ?? "/logo/mkos-logo.png";
  const brand = normalizeBrandText(cms?.settings.brand_name ?? BRAND_NAME);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(100);
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setDone(true);
          setLoaderComplete(true);
          notifyLoaderComplete();
        }, 400);
      }, 200);
      return;
    }

    let raf = 0;
    const start = performance.now();
    // Longer hold so the intro can land before the site reveals
    const duration = 3200;
    const holdAtEnd = 700;
    const exitMs = 1100;
    const failsafe = window.setTimeout(() => {
      setDone(true);
      setLoaderComplete(true);
      notifyLoaderComplete();
    }, duration + holdAtEnd + exitMs + 800);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * 100);
      setProgress(value);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => {
            setDone(true);
            setLoaderComplete(true);
            notifyLoaderComplete();
            window.clearTimeout(failsafe);
          }, exitMs);
        }, holdAtEnd);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, [setLoaderComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      s: Math.random() * 0.15 + 0.05,
      a: Math.random() * 0.4 + 0.1,
    }));

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.s * 0.002;
        if (p.y < -0.02) p.y = 1.02;
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 180, 255, ${p.a})`;
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={
            exiting
              ? { opacity: 0, scale: 1.04, filter: "blur(12px)" }
              : { opacity: 1, scale: 1, filter: "blur(0px)" }
          }
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "#050508" }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />

          <motion.div
            className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
            style={{
              x: glowX,
              y: glowY,
              background:
                "radial-gradient(circle, rgba(91,33,182,0.45) 0%, rgba(46,16,101,0.15) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          <div className="relative z-10 flex flex-col items-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.86, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: exiting ? 1.35 : 1, filter: "blur(0px)" }}
              transition={{ duration: exiting ? 1 : 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Image
                src={logoSrc}
                alt={brand}
                width={180}
                height={72}
                priority
                className="h-auto w-[140px] brightness-0 invert sm:w-[180px]"
              />
            </motion.div>

            <div className="mt-14 w-[220px] sm:w-[280px]">
              <div className="h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  className="h-full origin-left bg-gradient-to-r from-white/40 via-orange-300 to-white"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between font-display text-[11px] tracking-[0.35em] text-white/50">
                <span>LOADING</span>
                <span className="tabular-nums text-white/80">{progress}%</span>
              </div>
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={
              exiting
                ? { background: "radial-gradient(circle at center, transparent 0%, #fff 60%)" }
                : { background: "radial-gradient(circle at center, transparent 40%, #050508 100%)" }
            }
            transition={{ duration: 1.1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
