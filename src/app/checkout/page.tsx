"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, cartItemKey } from "@/store/cart";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const steps = ["Shipping", "Payment", "Review", "Confirmed"] as const;

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = subtotal > 300000 || subtotal === 0 ? 0 : 28000;
  const total = subtotal + shipping;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    first: "",
    last: "",
    address: "",
    city: "",
    zip: "",
    country: "United States",
    card: "",
    expiry: "",
    cvc: "",
  });

  if (items.length === 0 && step < 3) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-20 text-center">
        <h1 className="font-display text-4xl font-medium">Your bag is empty</h1>
        <Button href="/shop" className="mt-8">
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mkos-warm pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Complete your order
        </h1>

        {/* Progress */}
        <div className="mt-10 flex items-center gap-2 sm:gap-4">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-display text-xs",
                    i <= step ? "bg-mkos-ink text-white" : "bg-white text-mkos-muted"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "hidden font-display text-[10px] tracking-[0.18em] uppercase sm:inline",
                    i <= step ? "text-mkos-ink" : "text-mkos-muted"
                  )}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px flex-1", i < step ? "bg-mkos-ink" : "bg-mkos-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-white p-6 shadow-soft sm:p-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="ship"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl">Shipping</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Email"
                      value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      className="sm:col-span-2"
                    />
                    <Field label="First name" value={form.first} onChange={(v) => setForm({ ...form, first: v })} />
                    <Field label="Last name" value={form.last} onChange={(v) => setForm({ ...form, last: v })} />
                    <Field
                      label="Address"
                      value={form.address}
                      onChange={(v) => setForm({ ...form, address: v })}
                      className="sm:col-span-2"
                    />
                    <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Field label="ZIP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
                  </div>
                  <Button className="mt-8" size="lg" onClick={() => setStep(1)}>
                    Continue to payment
                  </Button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="pay"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl">Payment</h2>
                  <div className="mt-6 grid gap-4">
                    <Field label="Card number" value={form.card} onChange={(v) => setForm({ ...form, card: v })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry" value={form.expiry} onChange={(v) => setForm({ ...form, expiry: v })} />
                      <Field label="CVC" value={form.cvc} onChange={(v) => setForm({ ...form, cvc: v })} />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3 text-[10px] tracking-wider text-mkos-muted uppercase">
                    <span className="border border-mkos-border px-3 py-1">Secure SSL</span>
                    <span className="border border-mkos-border px-3 py-1">Encrypted</span>
                    <span className="border border-mkos-border px-3 py-1">Buyer protection</span>
                  </div>
                  <div className="mt-8 flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button size="lg" onClick={() => setStep(2)}>
                      Review order
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="rev"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl">Review</h2>
                  <p className="mt-3 text-sm text-mkos-muted">
                    {form.first} {form.last} · {form.email}
                    <br />
                    {form.address}, {form.city} {form.zip}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {items.map((item) => (
                      <li key={cartItemKey(item)} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span className="tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => {
                        useCartStore.getState().clear();
                        setStep(3);
                      }}
                    >
                      Place order · {formatPrice(total)}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mkos-ink text-white"
                  >
                    ✓
                  </motion.div>
                  <h2 className="mt-8 font-display text-3xl font-medium">Order confirmed</h2>
                  <p className="mt-3 text-mkos-muted">
                    A quiet confirmation is on its way to your inbox.
                  </p>
                  <Button href="/" className="mt-8">
                    Return home
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="h-fit bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-lg">Order summary</h2>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                <li key={cartItemKey(item)} className="flex gap-3">
                  <div className="relative h-20 w-16 overflow-hidden bg-mkos-warm">
                    <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm">{item.name}</p>
                    <p className="text-xs text-mkos-muted">
                      {item.color} / {item.size} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-mkos-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-mkos-muted">Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mkos-muted">Shipping</span>
                <span className="tabular-nums">{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between pt-2 font-display text-lg">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-mkos-muted">
              Need help? <Link href="/#faq" className="underline">Visit FAQ</Link>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
      />
    </label>
  );
}
