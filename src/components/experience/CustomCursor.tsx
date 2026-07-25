"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useUIStore } from "@/store/ui";

export function CustomCursor() {
  const cursorLabel = useUIStore((s) => s.cursorLabel);
  const cursorHover = useUIStore((s) => s.cursorHover);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const visible = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("has-custom-cursor");
    visible.current = true;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    window.addEventListener("mousemove", move);
    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
    };
  }, [x, y]);

  const active = cursorHover || !!cursorLabel;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9998] hidden mix-blend-difference md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      aria-hidden
    >
      <motion.div
        className="flex items-center justify-center rounded-full border border-white/80 bg-white/10 backdrop-blur-sm"
        animate={{
          width: active ? (cursorLabel ? 72 : 48) : 12,
          height: active ? (cursorLabel ? 72 : 48) : 12,
          scaleX: active ? 1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {cursorLabel && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-[10px] font-medium tracking-[0.2em] text-white"
          >
            {cursorLabel}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}
