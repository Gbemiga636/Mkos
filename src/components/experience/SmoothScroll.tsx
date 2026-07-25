"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useUIStore } from "@/store/ui";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __mkosLenis?: Lenis;
  }
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const loaderComplete = useUIStore((s) => s.loaderComplete);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
      autoRaf: false,
    });

    window.__mkosLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    requestAnimationFrame(refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(ticker);
      if (window.__mkosLenis === lenis) delete window.__mkosLenis;
      lenis.destroy();
      // Do NOT kill all ScrollTriggers here — section components own their own cleanup.
      // Global kill left GSAP inline opacity:0 styles with no tween to restore them.
    };
  }, []);

  // After intro loader / images settle, recalculate trigger positions
  useEffect(() => {
    if (!loaderComplete) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    const id2 = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, [loaderComplete]);

  return <>{children}</>;
}

export function scrollToTopSmooth() {
  if (typeof window === "undefined") return;
  const lenis = window.__mkosLenis;
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.45, easing: (t) => 1 - Math.pow(1 - t, 3) });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
