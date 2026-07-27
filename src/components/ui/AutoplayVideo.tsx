"use client";

import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";

type Props = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "autoPlay" | "muted" | "playsInline" | "controls" | "src" | "children"
> & {
  src: string;
  className?: string;
  /** Only play while in (or near) the viewport. Default true. */
  whenVisible?: boolean;
};

/**
 * Muted looping background video — no controls, no play button chrome.
 * Mounts on the client only so SSR/hydration never fights browser video DOM.
 */
export function AutoplayVideo({
  src,
  className,
  whenVisible = true,
  preload = "auto",
  ...rest
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const loaderComplete = useUIStore((s) => s.loaderComplete);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;

    el.controls = false;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.disablePictureInPicture = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("disablepictureinpicture", "");
    el.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");
    el.removeAttribute("controls");

    let inView = !whenVisible;
    let cancelled = false;

    const tryPlay = () => {
      if (cancelled || !inView) return;
      el.controls = false;
      el.muted = true;
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
    // If the browser surfaces a pause UI, kick play again immediately.
    el.addEventListener("pause", tryPlay);

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
      el.removeEventListener("pause", tryPlay);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [mounted, src, whenVisible, loaderComplete]);

  // Same shell on server + first client paint — avoid video attribute mismatches.
  if (!mounted) {
    return <div className={cn("bg-black", className)} aria-hidden />;
  }

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      disablePictureInPicture
      preload={preload}
      aria-hidden
      tabIndex={-1}
      controlsList="nodownload nofullscreen noremoteplayback"
      className={cn("mkos-autoplay-video", className)}
      {...rest}
    />
  );
}
