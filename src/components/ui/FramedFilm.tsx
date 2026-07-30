"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  /** Portrait film frame by default */
  aspect?: "portrait" | "landscape";
};

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Elegant framed film — click to play with sound. Never autoplays.
 */
export function FramedFilm({
  src,
  poster,
  className,
  aspect = "portrait",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      if (!el.duration) return;
      setProgress(el.currentTime / el.duration);
    };
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  async function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.muted = muted;
      try {
        await el.play();
      } catch {
        /* ignore */
      }
    } else {
      el.pause();
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  }

  return (
    <div
      className={cn(
        "group relative mx-auto overflow-hidden bg-mkos-ink shadow-[0_40px_80px_-40px_rgba(0,0,0,0.55)]",
        aspect === "portrait"
          ? "aspect-[9/16] w-full max-w-[380px] sm:max-w-[420px]"
          : "aspect-video w-full max-w-4xl",
        className
      )}
    >
      {/* Thin luxury frame */}
      <div className="pointer-events-none absolute inset-0 z-20 border border-white/15" />
      <div className="pointer-events-none absolute inset-[10px] z-20 border border-white/8 sm:inset-3" />

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        onClick={togglePlay}
      />

      {/* Soft vignette when paused */}
      {!playing && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      )}

      {/* Center play / pause */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause video" : "Play video"}
        className={cn(
          "absolute top-1/2 left-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white/35 bg-black/35 text-white backdrop-blur-sm transition-all sm:h-20 sm:w-20",
          playing
            ? "opacity-0 group-hover:opacity-100"
            : "opacity-100 hover:scale-105 hover:bg-black/50"
        )}
      >
        {playing ? (
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-5 w-[3px] bg-white" />
            <span className="h-5 w-[3px] bg-white" />
          </span>
        ) : (
          <span
            className="ml-1 h-0 w-0 border-y-[9px] border-y-transparent border-l-[16px] border-l-white"
            aria-hidden
          />
        )}
      </button>

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-4 transition-opacity sm:px-5 sm:pb-5",
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      >
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          tabIndex={0}
          onClick={seek}
          className="mb-3 h-[2px] cursor-pointer bg-white/25"
        >
          <div
            className="h-full bg-white transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[10px] tracking-[0.22em] text-white/70 uppercase">
            {formatTime((duration || 0) * progress)}
            <span className="text-white/35"> / </span>
            {formatTime(duration)}
          </p>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="font-display text-[10px] tracking-[0.22em] text-white/80 uppercase transition-colors hover:text-white"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </div>
    </div>
  );
}
