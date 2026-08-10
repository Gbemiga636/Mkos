"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/store/ui";
import { useBusyStore } from "@/store/busy";

export function GlobalSpinner() {
  const pathname = usePathname();
  const routeLoading = useUIStore((s) => s.routeLoading);
  const setRouteLoading = useUIStore((s) => s.setRouteLoading);
  const busy = useBusyStore((s) => s.busy);
  const label = useBusyStore((s) => s.label);
  const pulse = useBusyStore((s) => s.pulse);

  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 420);
    return () => clearTimeout(t);
  }, [pathname, setRouteLoading]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Skip loaders for opt-out controls (currency drop-up, hearts, etc.)
      if (target.closest("[data-no-busy]")) return;

      // Hearts / in-card controls inside links — never treat as navigation
      if (target.closest("button, [data-no-nav]")) {
        const interactive = target.closest("button, [data-no-nav]") as HTMLElement;
        if (interactive.tagName === "BUTTON" || interactive.hasAttribute("data-no-nav")) {
          // Only pulse for explicit submit / data-busy — not every button (e.g. currency)
          if (
            !target.closest("a") &&
            interactive.matches("[type='submit'], [data-busy]")
          ) {
            if (!(interactive as HTMLButtonElement).disabled) pulse();
          }
          return;
        }
      }

      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        if (anchor.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
          if (url.pathname === window.location.pathname && url.search === window.location.search) return;
          setRouteLoading(true);
          // Clear if navigation was cancelled (e.g. prevented default)
          window.setTimeout(() => setRouteLoading(false), 2800);
        } catch {
          /* ignore */
        }
        return;
      }

      const btn = target.closest("button, [type='submit'], [data-busy]");
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      pulse();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setRouteLoading, pulse]);

  const show = routeLoading || busy;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-mkos-white/55 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="h-11 w-11 rounded-full border-2 border-mkos-ink/10 border-t-mkos-accent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
            />
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
              {busy ? label : "Loading"}
            </p>
          </div>
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-mkos-accent via-mkos-accent-light to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
