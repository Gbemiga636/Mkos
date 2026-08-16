"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function AnimatedTick() {
  return (
    <div className="relative mx-auto h-24 w-24">
      <motion.span
        className="absolute inset-0 rounded-full bg-green-500/12"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border border-green-600/25"
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: 1.35, opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 0.6 }}
      />
      <svg viewBox="0 0 72 72" className="absolute inset-0 h-24 w-24" aria-hidden="true">
        <motion.circle
          cx="36"
          cy="36"
          r="32"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 50%", rotate: -90 }}
        />
        <motion.path
          d="M22 37.5 L31.5 46.5 L50.5 26.5"
          fill="none"
          stroke="#16a34a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.6, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

function BriefSuccessInner() {
  const params = useSearchParams();
  const service = params.get("service") || "";
  const name = (params.get("name") || "").trim().split(" ")[0] || "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-mkos-warm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,163,74,0.10),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-28 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="border border-mkos-border bg-white p-8 text-center sm:p-14"
        >
          <AnimatedTick />

          {service ? (
            <p className="mt-8 font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              {service} · Received
            </p>
          ) : (
            <p className="mt-8 font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Brief received
            </p>
          )}

          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {name ? `Thank you, ${name}.` : "Thank you for sharing your vision with MKoS."}
          </h1>

          {name ? (
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mkos-muted sm:text-base">
              Thank you for sharing your vision with MKoS.
            </p>
          ) : null}

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mkos-muted sm:text-base">
            Your brief has been received, and we’ll be in touch shortly to schedule your
            consultation and explore how we can bring your vision to life.
          </p>

          <p className="mx-auto mt-6 font-display text-lg tracking-tight text-mkos-ink sm:text-xl">
            Welcome to the MKoS experience.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button href="/#collections" size="lg">
              Shop MKoS
            </Button>
            <Button href="/" variant="secondary" size="lg">
              Back to home
            </Button>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-mkos-muted">
            A confirmation is on its way to your inbox. Studio · Oniru, Lagos ·{" "}
            <a
              href="mailto:styleme@mykindofstyle.com"
              className="underline underline-offset-2 hover:text-mkos-ink"
            >
              styleme@mykindofstyle.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function BriefSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mkos-warm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-mkos-ink/15 border-t-mkos-accent" />
        </div>
      }
    >
      <BriefSuccessInner />
    </Suspense>
  );
}
