"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const SERVICES = [
  {
    id: "rtw",
    title: "Ready-to-Wear",
    description: "Shop the latest collections for women and men.",
    href: "/shop?collection=ready-to-wear",
    available: true,
  },
  {
    id: "bespoke",
    title: "Bespoke / Custom Wear",
    description: "Begin a made-to-measure atelier brief.",
    href: "/bespoke",
    available: true,
  },
  {
    id: "bridal",
    title: "Bridal",
    description: "Luxurious bridal designs — coming soon.",
    href: "/#collections",
    available: false,
  },
] as const;

export function ServicesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close services"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-modal-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-t-2xl border border-white/15 bg-mkos-ink text-white shadow-2xl sm:rounded-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <p className="font-display text-[10px] tracking-[0.35em] text-mkos-accent uppercase">
                  MKoS
                </p>
                <h2 id="services-modal-title" className="mt-2 font-display text-2xl font-medium tracking-tight">
                  Our services
                </h2>
                <p className="mt-2 max-w-sm text-sm text-white/75">
                  Choose how you’d like to experience the house.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="font-display text-[10px] tracking-[0.22em] text-white uppercase transition-colors hover:text-white"
              >
                Close
              </button>
            </div>

            <ul className="divide-y divide-white/10">
              {SERVICES.map((service) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-lg tracking-tight">{service.title}</p>
                      {!service.available && (
                        <span className="font-display text-[9px] tracking-[0.22em] text-white/85 uppercase">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/70">{service.description}</p>
                  </>
                );

                return (
                  <li key={service.id}>
                    <Link
                      href={service.href}
                      onClick={onClose}
                      className="block px-6 py-5 transition-colors hover:bg-white/5 sm:px-8"
                    >
                      {inner}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
