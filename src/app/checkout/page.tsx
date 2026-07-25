"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, cartItemKey } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useCms, useFormatPrice } from "@/lib/cms/CmsProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUIStore } from "@/store/ui";

const steps = ["Shipping", "Review", "Pay"] as const;

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const { settings } = useCms();
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping =
    subtotal > settings.free_shipping_threshold || subtotal === 0 ? 0 : settings.shipping_fee;
  const total = subtotal + shipping;
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    first: "",
    last: "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos",
    zip: "",
    country: "Nigeria",
  });

  const hasPricedItems = useMemo(() => items.every((i) => i.price > 0), [items]);

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-20 text-center">
        <h1 className="font-display text-4xl font-medium">Your bag is empty</h1>
        <Button href="/shop" className="mt-8">
          Continue shopping
        </Button>
      </div>
    );
  }

  async function payWithPaystack() {
    setError("");
    if (!hasPricedItems) {
      setError("One or more pieces are price-on-request. Message the studio to complete this order.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: user?.id ?? null,
          items: items.map((i) => ({
            productId: i.productId,
            slug: i.slug,
            name: i.name,
            price: i.price,
            image: i.image,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment");
        return;
      }
      // Hand off to Paystack — success URL returns to /checkout/success
      window.location.href = data.authorization_url as string;
    } catch {
      setError("Network error starting payment. Please try again.");
    } finally {
      setPlacing(false);
    }
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
                  <p className="mt-2 text-sm text-mkos-muted">
                    We’ll use this for delivery and your confirmation email.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      className="sm:col-span-2"
                    />
                    <Field
                      label="First name"
                      value={form.first}
                      onChange={(v) => setForm({ ...form, first: v })}
                    />
                    <Field
                      label="Last name"
                      value={form.last}
                      onChange={(v) => setForm({ ...form, last: v })}
                    />
                    <Field
                      label="WhatsApp / phone"
                      value={form.phone}
                      onChange={(v) => setForm({ ...form, phone: v })}
                      className="sm:col-span-2"
                    />
                    <Field
                      label="Address"
                      value={form.address}
                      onChange={(v) => setForm({ ...form, address: v })}
                      className="sm:col-span-2"
                    />
                    <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Field
                      label="State"
                      value={form.state}
                      onChange={(v) => setForm({ ...form, state: v })}
                    />
                    <Field label="ZIP / postal" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
                    <Field
                      label="Country"
                      value={form.country}
                      onChange={(v) => setForm({ ...form, country: v })}
                    />
                  </div>
                  <Button
                    className="mt-8"
                    size="lg"
                    onClick={() => {
                      if (!form.email || !form.first || !form.last || !form.phone || !form.address || !form.city) {
                        setError("Please fill email, name, phone, address, and city.");
                        return;
                      }
                      setError("");
                      setStep(1);
                    }}
                  >
                    Continue to review
                  </Button>
                  {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="rev"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl">Review</h2>
                  {!user && (
                    <p className="mt-3 text-sm text-mkos-muted">
                      <button
                        type="button"
                        className="underline underline-offset-2"
                        onClick={() => openAuth("signin")}
                      >
                        Sign in
                      </button>{" "}
                      to save this order to your account (optional).
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-mkos-muted">
                    {form.first} {form.last} · {form.email} · {form.phone}
                    <br />
                    {form.address}, {form.city}
                    {form.state ? `, ${form.state}` : ""} {form.zip}
                    <br />
                    {form.country}
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
                  <div className="mt-6 rounded-none border border-mkos-border bg-mkos-warm/50 p-4 text-sm text-mkos-muted">
                    You’ll pay securely with <strong className="text-mkos-ink">Paystack</strong> —
                    cards, bank transfer, and USSD. After payment you’ll land on your order
                    confirmation page and receive email receipts.
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button
                      size="lg"
                      variant="checkout"
                      disabled={placing}
                      onClick={payWithPaystack}
                    >
                      {placing ? "Redirecting…" : `Pay with Paystack · ${formatPrice(total)}`}
                    </Button>
                  </div>
                  {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
                <span className="tabular-nums">
                  {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between pt-2 font-display text-lg">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-mkos-muted">
              Need help?{" "}
              <Link href="/about#contact" className="underline">
                Contact the studio
              </Link>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 text-sm outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
      />
    </label>
  );
}
