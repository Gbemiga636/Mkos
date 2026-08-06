"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WORLD_CURRENCIES } from "@/lib/currency/currencies";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher() {
  const { currency, setCurrency, ratesReady, rates } = useCurrency();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return WORLD_CURRENCIES;
    return WORLD_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-5 z-[70] flex h-12 items-center gap-2 border border-white/20 bg-mkos-ink px-4 text-white shadow-lg sm:bottom-8 sm:left-8"
        aria-label="Change currency"
      >
        <span className="font-display text-[10px] tracking-[0.2em] uppercase opacity-70">
          Currency
        </span>
        <span className="font-display text-sm tracking-wide">{currency}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose currency"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="flex max-h-[80vh] w-full max-w-lg flex-col border border-mkos-border bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-mkos-border px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                      Worldwide currencies
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-medium tracking-tight">
                      Choose how prices display
                    </h2>
                    <p className="mt-2 text-xs text-mkos-muted">
                      Default is USD. Catalogue prices convert with live FX
                      {ratesReady ? "" : " (updating…)"}. Nigeria checkout stays in Naira via
                      Paystack.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="font-display text-[10px] tracking-[0.16em] uppercase"
                  >
                    Close
                  </button>
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search currency or country…"
                  className="mt-4 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-ink"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto px-2 py-2">
                {filtered.map((c) => {
                  const available = c.code === "NGN" || Boolean(rates[c.code]);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setCurrency(c.code);
                        setOpen(false);
                        setQ("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-3 text-left transition-colors",
                        currency === c.code ? "bg-mkos-warm" : "hover:bg-mkos-warm/60",
                        !available && "opacity-40"
                      )}
                    >
                      <span>
                        <span className="font-display text-sm tracking-wide">{c.code}</span>
                        <span className="mt-0.5 block text-xs text-mkos-muted">{c.name}</span>
                      </span>
                      {currency === c.code ? (
                        <span className="font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {!filtered.length ? (
                  <p className="px-3 py-8 text-center text-sm text-mkos-muted">No matches.</p>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
