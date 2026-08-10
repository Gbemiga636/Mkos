"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useCartStore, cartItemKey } from "@/store/cart";
import { useCms, useFormatPrice } from "@/lib/cms/CmsProvider";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const { products } = useCms();
  const formatPrice = useFormatPrice();
  const stylesCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotalValue = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const spring = useSpring(subtotalValue, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => formatPrice(Math.round(v)));

  useEffect(() => {
    spring.set(subtotalValue);
  }, [subtotalValue, spring]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const recs = products.filter((p) => !items.some((i) => i.productId === p.id)).slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[80] bg-mkos-ink/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed top-0 right-0 z-[81] flex h-full w-full max-w-md flex-col bg-white shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-mkos-border px-6 py-5">
              <div>
                <p className="font-display text-[11px] tracking-[0.28em] uppercase">Your bag</p>
                <p className="mt-1 text-sm text-mkos-muted">
                  {stylesCount} {stylesCount === 1 ? "style" : "styles"}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="font-display text-[11px] tracking-[0.22em] uppercase"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-display text-2xl">Your bag is empty</p>
                  <p className="mt-2 text-sm text-mkos-muted">Begin with something exceptional.</p>
                  <Button href="/shop" className="mt-8" onClick={close}>
                    Explore
                  </Button>
                </div>
              ) : (
                <ul className="space-y-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const key = cartItemKey(item);
                      return (
                        <motion.li
                          key={key}
                          layout
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24, height: 0 }}
                          className="flex gap-4"
                        >
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={close}
                            className="relative h-28 w-22 shrink-0 overflow-hidden bg-mkos-warm"
                          >
                            <Image src={item.image} alt="" fill className="object-cover" sizes="88px" />
                          </Link>
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between gap-3">
                              <div>
                                <p className="font-display text-base">{item.name}</p>
                                <p className="mt-1 text-xs text-mkos-muted">
                                  {[
                                    item.color && `Colour ${item.color}`,
                                    item.size &&
                                      `${item.sizingMode === "length" ? "Length" : "Size"} ${item.size}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "Atelier piece"}
                                </p>
                              </div>
                              <p className="font-display text-sm tabular-nums">
                                {formatPrice(item.price * item.quantity, {
                                  usd:
                                    item.priceUsd != null
                                      ? item.priceUsd * item.quantity
                                      : null,
                                })}
                              </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-3">
                              <div className="flex items-center border border-mkos-border">
                                <button
                                  type="button"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(key, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(key, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(key)}
                                className="text-xs text-mkos-muted underline-offset-2 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}

              {items.length > 0 && recs.length > 0 && (
                <div className="mt-12">
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                    You may also like
                  </p>
                  <div className="mt-4 space-y-3">
                    {recs.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={close}
                        className="flex items-center gap-3 py-2"
                      >
                        <div className="relative h-16 w-12 overflow-hidden bg-mkos-warm">
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-display text-sm">{p.name}</p>
                          <p className="text-xs text-mkos-muted">
                            {formatPrice(p.price, { usd: p.priceUsd })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-mkos-border px-6 py-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mkos-muted">Subtotal</span>
                  <motion.span className="font-display text-xl tabular-nums">{display}</motion.span>
                </div>
                <p className="mt-2 text-xs text-mkos-muted">
                  Delivery arranged at checkout · fees quoted separately
                </p>
                <Button href="/checkout" size="lg" variant="checkout" className="mt-5 w-full" onClick={close}>
                  <span>Checkout</span>
                  <span className="font-body tracking-normal normal-case opacity-90">→</span>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
