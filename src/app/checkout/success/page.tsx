"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { PostPurchaseReviews } from "@/components/product/PostPurchaseReviews";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/cms/types";

type OrderPayload = {
  id: string;
  email: string | null;
  shipping_name: string | null;
  total: number;
  currency: string;
  payment_status: string;
  paid_at: string | null;
  paystack_reference: string | null;
  order_items?: {
    product_id?: string | null;
    slug?: string | null;
    name: string;
    quantity: number;
    price: number;
    image: string | null;
    color: string | null;
    size: string | null;
    sizing_mode?: string | null;
  }[];
};

function SuccessInner() {
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const sessionId = params.get("session_id") || "";
  const clearCart = useCartStore((s) => s.clear);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Confirming your payment…");
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [experienceOpen, setExperienceOpen] = useState(false);

  useEffect(() => {
    if (!reference && !sessionId) {
      setStatus("error");
      setMessage(
        "Missing payment reference. If you were charged, contact the studio with your bank receipt."
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        if (sessionId || reference.startsWith("mkos_st_")) {
          const stripeRes = await fetch("/api/checkout/stripe/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, reference }),
          });
          const stripeData = await stripeRes.json();
          if (!stripeRes.ok && !reference) {
            if (cancelled) return;
            setStatus("error");
            setMessage(stripeData.error || "We couldn’t confirm this Stripe payment yet.");
            return;
          }
        }

        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "We couldn’t confirm this payment yet.");
          return;
        }
        setOrder(data.order);
        clearCart();
        setStatus("ok");
        setMessage("Payment confirmed.");
        window.setTimeout(() => {
          if (!cancelled) setExperienceOpen(true);
        }, 700);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error confirming payment. Please refresh or contact the studio.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, sessionId, clearCart]);

  useEffect(() => {
    if (!experienceOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExperienceOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [experienceOpen]);

  const currency = order?.currency || "NGN";
  const firstName = order?.shipping_name?.split(" ")[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-mkos-warm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,92,38,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-28 sm:px-8">
        {status === "loading" && (
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-mkos-ink/15 border-t-mkos-accent" />
            <p className="mt-6 font-display text-xl tracking-tight">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="border border-mkos-border bg-white p-8 text-center sm:p-12">
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Payment
            </p>
            <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              We’re still checking
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-mkos-muted">
              {message}
            </p>
            {reference && (
              <p className="mt-4 font-display text-xs tracking-[0.14em] text-mkos-muted uppercase">
                Ref · {reference}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/about#contact">Contact studio</Button>
              <Button href="/shop" variant="secondary">
                Continue shopping
              </Button>
            </div>
          </div>
        )}

        {status === "ok" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-mkos-border bg-white"
          >
            <div className="border-b border-mkos-border bg-mkos-ink px-6 py-10 text-center text-white sm:px-10">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mkos-accent text-xl"
              >
                ✓
              </motion.div>
              <p className="mt-6 font-display text-[11px] tracking-[0.35em] text-white/55 uppercase">
                <BrandText>MKoS</BrandText>
              </p>
              <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
                Order confirmed
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm text-white/70">
                Thank you{firstName ? `, ${firstName}` : ""}. A detailed confirmation is on its way
                to {order?.email || "your inbox"}.
              </p>
            </div>

            <div className="px-6 py-8 sm:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-mkos-border pb-6">
                <div>
                  <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                    Reference
                  </p>
                  <p className="mt-2 font-display text-lg tracking-tight">
                    {order?.paystack_reference || reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                    Total paid
                  </p>
                  <p className="mt-2 font-display text-2xl tracking-tight text-mkos-accent">
                    {formatPrice(Number(order?.total || 0), currency)}
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-4">
                {(order?.order_items || []).map((item, i) => (
                  <li key={`${item.name}-${i}`} className="flex gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-mkos-warm">
                      {item.image ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base">{item.name}</p>
                      <p className="mt-1 text-xs text-mkos-muted">
                        {[
                          item.color,
                          item.size
                            ? `${item.sizing_mode === "length" ? "Length" : "Size"} ${item.size}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "Atelier piece"}{" "}
                        · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm tabular-nums">
                      {formatPrice(Number(item.price) * item.quantity, currency)}
                    </p>
                  </li>
                ))}
              </ul>

              {status === "ok" && reference && order ? (
                <PostPurchaseReviews
                  reference={reference}
                  email={order.email}
                  items={(order.order_items || []).map((i) => ({
                    productId: i.product_id,
                    slug: i.slug,
                    name: i.name,
                  }))}
                />
              ) : null}

              <div className="mt-10 flex flex-wrap gap-3">
                <Button href="/shop" size="lg">
                  Continue shopping
                </Button>
                <Button href="/account" variant="secondary" size="lg">
                  View account
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setExperienceOpen(true)}
                >
                  MKoS Experience
                </Button>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-mkos-muted">
                Studio enquiries:{" "}
                <Link href="/about#contact" className="underline underline-offset-2">
                  Contact MKoS
                </Link>
                . Keep this reference for WhatsApp follow-ups.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {experienceOpen && status === "ok" && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-mkos-ink/55 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExperienceOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="experience-invite-title"
              className="w-full max-w-lg border border-white/10 bg-white p-7 shadow-lift sm:p-10"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-display text-[11px] tracking-[0.32em] text-mkos-accent uppercase">
                Next step
              </p>
              <h2
                id="experience-invite-title"
                className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl"
              >
                Join the MKoS <span className="italic">Experience</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-mkos-muted sm:text-base">
                {firstName ? `${firstName}, y` : "Y"}our order is confirmed. When you visit the
                studio, tell us if you’d like to be part of MKoS Experience content — or book Full
                Glam for your event. Continue now, or close and stay on this page.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/experience" size="lg" cursor="EXPLORE">
                  Go to Experience
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setExperienceOpen(false)}
                  cursor=""
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mkos-warm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-mkos-ink/15 border-t-mkos-accent" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
