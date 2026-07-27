"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";

type Props = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "autoPlay" | "muted" | "playsInline" | "src" | "children"
> & {
  src: string;
  className?: string;
  /** Only play while in (or near) the viewport. Default true. */
  whenVisible?: boolean;
};

/**
 * Muted looping background video with reliable autoplay across Chrome/Safari/iOS,
 * including after the intro loader and when scrolling into view.
 */
export function AutoplayVideo({
  src,
  className,
  whenVisible = true,
  preload = "auto",
  ...rest
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const loaderComplete = useUIStore((s) => s.loaderComplete);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    let inView = !whenVisible;
    let cancelled = false;

    const tryPlay = () => {
      if (cancelled || !inView) return;
      if (!el.paused) return;
      void el.play().catch(() => {
        /* Policy may block until gesture; listeners below retry. */
      });
    };

    const tryPause = () => {
      if (!el.paused) el.pause();
    };

    tryPlay();
    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if (whenVisible && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) tryPlay();
          else tryPause();
        },
        { rootMargin: "10% 0px", threshold: 0.05 }
      );
      io.observe(el);
    }

    const unlock = () => tryPlay();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [src, whenVisible, loaderComplete]);

  return (
    <video
      ref={ref}
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      {...({ "webkit-playsinline": "true" } as React.HTMLAttributes<HTMLVideoElement>)}
      className={cn(className)}
      {...rest}
    />
  );
}
