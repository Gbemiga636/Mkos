"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in ms after entering view */
  delay?: number;
  /** y offset in px before reveal */
  y?: number;
  once?: boolean;
  as?: "div" | "span" | "li" | "article" | "section";
  style?: CSSProperties;
};

/**
 * Fade + slide-up on scroll. Only reveals when the element enters the viewport —
 * never pre-reveals off-screen content (that made animations look "broken").
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
  as: Tag = "div",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setShown(true);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          if (once) io.disconnect();
        } else if (!once) {
          revealed = false;
          setShown(false);
        }
      },
      // Start a bit before fully in view so the motion is visible while scrolling
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-mkos-reveal={shown ? "in" : "out"}
      className={cn("mkos-reveal", shown && "mkos-reveal-in", className)}
      style={
        {
          ...style,
          "--reveal-y": `${y}px`,
          transitionDelay: shown ? `${delay}ms` : "0ms",
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
