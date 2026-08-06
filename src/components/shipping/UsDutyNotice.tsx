"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrencyStore } from "@/store/currency";

export function UsDutyNotice() {
  const dismissed = useCurrencyStore((s) => s.usNoticeDismissed);
  const dismiss = useCurrencyStore((s) => s.dismissUsNotice);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const open = ready && !dismissed;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="us-duty-title"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="w-full max-w-md border border-mkos-border bg-white p-7 shadow-2xl sm:p-9"
          >
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              U.S. Important Shipping Update
            </p>
            <p className="mt-3 font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
              AMP
            </p>
            <h2 id="us-duty-title" className="mt-4 font-display text-2xl font-medium tracking-tight">
              17% U.S. import duty
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mkos-muted">
              The U.S. has introduced a 17% import duty on international orders. This duty is
              applied by U.S. customs at delivery.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              It is separate from your MKoS product total and any shipping quote. Your carrier or
              customs broker may collect it before releasing the parcel.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-8 h-12 w-full bg-mkos-ink font-display text-[11px] tracking-[0.2em] text-white uppercase"
            >
              I understand
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
