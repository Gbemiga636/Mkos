"use client";

import { useLayoutEffect, useRef, type VideoHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import {
  bindGlobalAutoplayUnlock,
  LOADER_COMPLETE_EVENT,
  registerAutoplayVideo,
  setupInlineVideo,
  tryPlayInline,
} from "@/lib/video/autoplay";

type Props = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "autoPlay" | "muted" | "playsInline" | "controls" | "src" | "children"
> & {
  src: string;
  className?: string;
  /** Only play while in (or near) the viewport. Default true. */
  whenVisible?: boolean;
  /** Hero / above-the-fold — preload fully and retry harder. */
  eager?: boolean;
};

/**
 * Muted looping background video — no controls, no play button.
 * Optimised for iOS Safari (no transformed parents; inline muted play).
 */
export function AutoplayVideo({
  src,
  className,
  whenVisible = true,
  eager = false,
  preload,
  ...rest
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const loaderComplete = useUIStore((s) => s.loaderComplete);
  const resolvedPreload = preload ?? (eager ? "auto" : "metadata");

  useLayoutEffect(() => {
    bindGlobalAutoplayUnlock();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    setupInlineVideo(el);
    const unregister = registerAutoplayVideo(el);

    let inView = !whenVisible;
    let cancelled = false;
    const retryTimers: number[] = [];

    const tryPlay = () => {
      if (cancelled || !inView) return;
      void tryPlayInline(el);
    };

    const clearRetries = () => {
      while (retryTimers.length) {
        window.clearTimeout(retryTimers.pop());
      }
    };

    const scheduleRetries = () => {
      clearRetries();
      // iOS often needs staggered retries after loader + first paint.
      [0, 120, 350, 800, 1500, 3000].forEach((ms) => {
        retryTimers.push(
          window.setTimeout(() => {
            if (!cancelled) tryPlay();
          }, ms)
        );
      });
    };

    const tryPause = () => {
      if (!el.paused) el.pause();
    };

    if (eager && el.readyState === 0) {
      el.load();
    }

    tryPlay();
    scheduleRetries();

    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("canplaythrough", tryPlay);

    const onLoaderDone = () => {
      if (eager || !whenVisible) scheduleRetries();
      tryPlay();
    };
    window.addEventListener(LOADER_COMPLETE_EVENT, onLoaderDone);

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if (whenVisible && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) {
            tryPlay();
            scheduleRetries();
          } else {
            tryPause();
          }
        },
        { rootMargin: "20% 0px", threshold: 0.01 }
      );
      io.observe(el);
    }

    return () => {
      cancelled = true;
      clearRetries();
      unregister();
      el.removeEventListener("loadedmetadata", tryPlay);
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("canplaythrough", tryPlay);
      window.removeEventListener(LOADER_COMPLETE_EVENT, onLoaderDone);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, [src, whenVisible, eager, loaderComplete]);

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
      preload={resolvedPreload}
      aria-hidden
      tabIndex={-1}
      suppressHydrationWarning
      controlsList="nodownload nofullscreen noremoteplayback"
      className={cn("mkos-autoplay-video", className)}
      {...rest}
    />
  );
}
