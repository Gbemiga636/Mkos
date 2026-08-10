"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WORLD_CURRENCIES } from "@/lib/currency/currencies";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher() {
  const { currency, setCurrency, ratesReady, rates } = useCurrency();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return WORLD_CURRENCIES;
    return WORLD_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle)
    );
  }, [q]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => searchRef.current?.focus(), 40);

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-no-busy
      className="fixed bottom-5 left-4 z-[70] sm:bottom-8 sm:left-8"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            role="listbox"
            aria-label="Choose currency"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 flex w-[min(18.5rem,calc(100vw-2rem))] origin-bottom-left flex-col overflow-hidden border border-white/15 bg-mkos-ink text-white shadow-2xl"
          >
            <div className="border-b border-white/10 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[9px] tracking-[0.22em] text-white/55 uppercase">
                  Currency{ratesReady ? "" : " · …"}
                </p>
                <button
                  type="button"
                  data-no-busy
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                  className="font-display text-[9px] tracking-[0.16em] text-white/55 uppercase hover:text-white"
                >
                  Close
                </button>
              </div>
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="mt-2 h-9 w-full border border-white/15 bg-white/5 px-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
              />
            </div>
            <div className="max-h-[min(42vh,17.5rem)] overflow-y-auto overscroll-contain sm:max-h-[min(48vh,20rem)]">
              {filtered.map((c) => {
                const available = c.code === "NGN" || Boolean(rates[c.code]);
                const selected = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={!available}
                    data-no-busy
                    onClick={() => {
                      setCurrency(c.code);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-white/12" : "hover:bg-white/8",
                      !available && "opacity-35"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-display text-sm tracking-wide">{c.code}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/50">
                        {c.name}
                      </span>
                    </span>
                    {selected ? (
                      <span className="shrink-0 font-display text-[8px] tracking-[0.14em] text-mkos-accent uppercase">
                        On
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!filtered.length ? (
                <p className="px-3 py-6 text-center text-xs text-white/45">No matches.</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        data-no-busy
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 border border-white/20 bg-mkos-ink px-2.5 text-white shadow-lg sm:h-10 sm:px-3"
        aria-label="Change currency"
      >
        <span className="font-display text-sm tracking-wide">{currency}</span>
        <svg
          className={cn(
            "h-3 w-3 opacity-60 transition-transform duration-200",
            open && "rotate-180"
          )}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
