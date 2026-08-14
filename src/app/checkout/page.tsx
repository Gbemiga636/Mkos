"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, cartItemKey } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/lib/cms/CmsProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DELIVERY_FEE_NOTE,
  DELIVERY_METHODS,
  STUDIO_PICKUP_ADDRESS,
  deliveryMethodLabel,
  type DeliveryMethod,
} from "@/lib/checkout/delivery";

const steps = ["Delivery", "Review", "Pay"] as const;

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  // Product total only — delivery is quoted separately after checkout
  const total = subtotal;
  const subtotalUsd = items.every((i) => i.priceUsd != null && i.priceUsd > 0)
    ? items.reduce((n, i) => n + (i.priceUsd ?? 0) * i.quantity, 0)
    : null;
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    first: "",
    last: "",
    phone: "",
    deliveryMethod: "" as "" | DeliveryMethod,
    expectedDeliveryDate: "",
    address: "",
    city: "",
    state: "Lagos",
    zip: "",
    country: "Nigeria",
  });

  const needsAddress =
    form.deliveryMethod === "home_delivery" || form.deliveryMethod === "international";
  const hasPricedItems = useMemo(
    () =>
      items.every(
        (i) =>
          (i.priceUsd != null && i.priceUsd > 0) || i.price > 0
      ),
    [items]
  );

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

  async function payWithFlutterwave() {
    setError("");
    if (!hasPricedItems) {
      setError("One or more styles are price-on-request. Message the studio to complete this order.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/flutterwave/initialize", {
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
            priceUsd: i.priceUsd ?? null,
            image: i.image,
            color: i.color,
            size: i.size,
            sizingMode: i.sizingMode ?? null,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start Flutterwave payment");
        return;
      }
      if (!data.url) {
        setError("Could not reach Flutterwave checkout. Please try again.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setError("Network error starting Flutterwave. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  async function pay() {
    return payWithFlutterwave();
  }

  function validateDelivery() {
    if (!form.email || !form.first || !form.last || !form.phone) {
      return "Please fill email, name, and phone.";
    }
    if (!form.deliveryMethod) {
      return "Please choose a delivery method.";
    }
    if (!form.expectedDeliveryDate) {
      return "Please share your expected delivery / pickup date.";
    }
    if (needsAddress && (!form.address || !form.city || !form.country)) {
      return "Please complete your delivery address, city, and country.";
    }
    return "";
  }

  const addressSummary =
    form.deliveryMethod === "pickup"
      ? STUDIO_PICKUP_ADDRESS
      : [
          form.address,
          [form.city, form.state, form.zip].filter(Boolean).join(", "),
          form.country,
        ]
          .filter(Boolean)
          .join("\n");

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
                  <h2 className="font-display text-2xl">Delivery</h2>
                  <p className="mt-2 text-sm text-mkos-muted">
                    Product prices do not include delivery. Choose how you’d like to receive your
                    order — we’ll confirm any delivery fee with you before dispatch.
                  </p>

                  <div className="mt-8">
                    <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                      Delivery method
                    </p>
                    <div className="mt-3 grid gap-3">
                      {DELIVERY_METHODS.map((m) => {
                        const active = form.deliveryMethod === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                deliveryMethod: m.value,
                                country:
                                  m.value === "international" && f.country === "Nigeria"
                                    ? ""
                                    : m.value !== "international" && !f.country
                                      ? "Nigeria"
                                      : f.country || "Nigeria",
                                state:
                                  m.value === "home_delivery" && !f.state ? "Lagos" : f.state,
                              }));
                            }}
                            className={cn(
                              "border px-4 py-4 text-left transition-colors",
                              active
                                ? "border-mkos-ink bg-mkos-ink text-white"
                                : "border-mkos-border bg-mkos-warm/40 hover:border-mkos-ink/40"
                            )}
                          >
                            <span className="font-display text-sm tracking-[0.08em] uppercase">
                              {m.label}
                              {m.note ? (
                                <>
                                  {" "}
                                  <strong className="font-semibold normal-case tracking-normal">
                                    {m.note}
                                  </strong>
                                </>
                              ) : null}
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-xs",
                                active ? "text-white/70" : "text-mkos-muted"
                              )}
                            >
                              {m.short}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 border border-mkos-border bg-mkos-warm/60 p-4 text-sm leading-relaxed text-mkos-ink/85">
                    <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                      Please note
                    </p>
                    <p className="mt-2">{DELIVERY_FEE_NOTE}</p>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
                      label={
                        form.deliveryMethod === "pickup"
                          ? "Expected pickup date"
                          : "Expected delivery date"
                      }
                      type="date"
                      value={form.expectedDeliveryDate}
                      onChange={(v) => setForm({ ...form, expectedDeliveryDate: v })}
                      className="sm:col-span-2"
                    />
                  </div>

                  {form.deliveryMethod === "pickup" && (
                    <div className="mt-6 border-t border-mkos-border pt-6">
                      <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                        Pickup location
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-mkos-ink">
                        {STUDIO_PICKUP_ADDRESS}
                      </p>
                    </div>
                  )}

                  {needsAddress && (
                    <div className="mt-8 border-t border-mkos-border pt-8">
                      <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                        Delivery address
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Street address"
                          value={form.address}
                          onChange={(v) => setForm({ ...form, address: v })}
                          className="sm:col-span-2"
                        />
                        <Field
                          label="City"
                          value={form.city}
                          onChange={(v) => setForm({ ...form, city: v })}
                        />
                        <Field
                          label="State / region"
                          value={form.state}
                          onChange={(v) => setForm({ ...form, state: v })}
                        />
                        <Field
                          label="ZIP / postal"
                          value={form.zip}
                          onChange={(v) => setForm({ ...form, zip: v })}
                        />
                        <Field
                          label="Country"
                          value={form.country}
                          onChange={(v) => setForm({ ...form, country: v })}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="mt-8"
                    size="lg"
                    onClick={() => {
                      const msg = validateDelivery();
                      if (msg) {
                        setError(msg);
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
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-mkos-muted">
                    <p>
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-ink uppercase">
                        Contact
                      </span>
                      <br />
                      {form.first} {form.last} · {form.email} · {form.phone}
                    </p>
                    <p>
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-ink uppercase">
                        Delivery method
                      </span>
                      <br />
                      {deliveryMethodLabel(form.deliveryMethod)}
                    </p>
                    <p>
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-ink uppercase">
                        {form.deliveryMethod === "pickup"
                          ? "Expected pickup date"
                          : "Expected delivery date"}
                      </span>
                      <br />
                      {form.expectedDeliveryDate
                        ? new Date(form.expectedDeliveryDate + "T12:00:00").toLocaleDateString(
                            undefined,
                            { weekday: "short", year: "numeric", month: "long", day: "numeric" }
                          )
                        : "—"}
                    </p>
                    <p className="whitespace-pre-line">
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-ink uppercase">
                        {form.deliveryMethod === "pickup" ? "Pickup location" : "Delivery address"}
                      </span>
                      <br />
                      {addressSummary}
                    </p>
                  </div>
                  <ul className="mt-6 space-y-4">
                    {items.map((item) => (
                      <li key={cartItemKey(item)} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span className="tabular-nums">
                          {formatPrice(item.price * item.quantity, {
                            usd: item.priceUsd != null ? item.priceUsd * item.quantity : null,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 border border-mkos-border bg-mkos-warm/50 p-4 text-sm text-mkos-muted">
                    <p>
                      You’ll pay securely with{" "}
                      <strong className="text-mkos-ink">Flutterwave</strong> in USD. Delivery fees
                      (if any) are quoted separately before dispatch. U.S. customs may apply a 17%
                      import duty at delivery.{" "}
                      <a href="/shipping" className="underline underline-offset-2">
                        Shipping details
                      </a>
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button
                      size="lg"
                      variant="checkout"
                      disabled={placing}
                      onClick={pay}
                    >
                      {placing
                        ? "Preparing payment…"
                        : `Pay with Flutterwave · ${formatPrice(total, { usd: subtotalUsd })}`}
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
                      {[
                        item.color && `Colour ${item.color}`,
                        item.size &&
                          `${item.sizingMode === "length" ? "Length" : "Size"} ${item.size}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Atelier piece"}{" "}
                      × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatPrice(item.price * item.quantity, {
                      usd: item.priceUsd != null ? item.priceUsd * item.quantity : null,
                    })}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-mkos-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-mkos-muted">Subtotal</span>
                <span className="tabular-nums">
                  {formatPrice(subtotal, { usd: subtotalUsd })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-mkos-muted">Delivery</span>
                <span className="max-w-[12rem] text-right text-xs leading-snug text-mkos-muted">
                  Not included · quoted by location
                </span>
              </div>
              <div className="flex justify-between pt-2 font-display text-lg">
                <span>Total due now</span>
                <span className="tabular-nums">{formatPrice(total, { usd: subtotalUsd })}</span>
              </div>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-mkos-muted">{DELIVERY_FEE_NOTE}</p>
            <p className="mt-4 text-xs text-mkos-muted">
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
