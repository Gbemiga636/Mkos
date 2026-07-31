"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandText } from "@/components/ui/BrandText";

const STORAGE_KEY = "mkos_newsletter_prompt_v1";

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not subscribe");
      setStatus("ok");
      setMessage("You're on the list — thank you.");
      window.setTimeout(dismiss, 1200);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not subscribe");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-mkos-ink/45 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-popup-title"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md border border-mkos-border bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-4 right-4 font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
            >
              Close
            </button>

            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Stay close
            </p>
            <h2
              id="newsletter-popup-title"
              className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-3xl"
            >
              <BrandText>Get MKoS updates</BrandText>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              New drops, fittings, and house notes — straight to your inbox. Enter your email once;
              we won’t spam you.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                disabled={status === "loading" || status === "ok"}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-12 w-full border border-mkos-border bg-mkos-warm/40 px-4 text-sm outline-none focus:border-mkos-ink"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "ok"}
                className="h-12 w-full bg-mkos-ink font-display text-[11px] tracking-[0.18em] text-white uppercase disabled:opacity-50"
              >
                {status === "loading"
                  ? "Joining…"
                  : status === "ok"
                    ? "Joined"
                    : "Join"}
              </button>
            </form>

            {message && (
              <p
                className={`mt-3 text-sm ${status === "error" ? "text-red-700" : "text-mkos-muted"}`}
              >
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
