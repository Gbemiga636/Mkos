"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/cms/types";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { useCartStore, productToCartItem } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";
import { useCms, useFormatPrice } from "@/lib/cms/CmsProvider";
import { objectPositionCss } from "@/lib/media/imageFocus";
import { cn } from "@/lib/utils";

export default function ProductClient({ product: initial }: { product: Product }) {
  const { products } = useCms();
  const formatPrice = useFormatPrice();
  const product = products.find((p) => p.id === initial.id) ?? initial;

  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const addRecentlyViewed = useUIStore((s) => s.addRecentlyViewed);
  const recentlyViewed = useUIStore((s) => s.recentlyViewed);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          (p.collection === product.collection || p.category === product.category)
      )
      .slice(0, 4);
  }, [product, products]);

  const fbt = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.id !== product.id).slice(0, 2);
  }, [product, products]);

  const recentProducts = recentlyViewed
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  useEffect(() => {
    addRecentlyViewed(product.id);
  }, [product.id, addRecentlyViewed]);

  useEffect(() => {
    setSize(product.sizes[1] ?? product.sizes[0] ?? "");
    setActive(0);
  }, [product]);

  return (
    <div className="bg-white pt-24 pb-24">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-mkos-warm">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 cursor-zoom-in"
                onClick={() => setFullscreen(true)}
              >
                <Image
                  src={product.images[active]}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  style={{ objectPosition: objectPositionCss(product.imageFocus?.[active]) }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-24 w-20 shrink-0 overflow-hidden border transition-all",
                  active === i ? "border-mkos-ink" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  style={{ objectPosition: objectPositionCss(product.imageFocus?.[i]) }}
                />
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <p className="font-display text-[11px] tracking-[0.3em] text-mkos-muted uppercase">
            {product.collection.replace("-", " ")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-2 text-mkos-muted">{product.tagline}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-2xl tabular-nums">{formatPrice(product.price)}</p>
            {product.compareAt && (
              <p className="text-sm text-mkos-muted line-through">
                {formatPrice(product.compareAt)}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-mkos-muted">
            ★ {product.rating} · {product.reviews} reviews
          </p>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-mkos-muted sm:text-base">
            {product.description}
          </p>

          <div className="mt-8">
            <p className="font-display text-[11px] tracking-[0.22em] uppercase">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-12 border px-4 py-2 font-display text-sm transition-colors",
                    size === s ? "border-mkos-ink bg-mkos-ink text-white" : "border-mkos-border"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-mkos-border">
              <button type="button" className="h-12 w-10" onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <span className="w-10 text-center tabular-nums">{qty}</span>
              <button type="button" className="h-12 w-10" onClick={() => setQty(qty + 1)}>
                +
              </button>
            </div>
            <div className="text-sm">
              <p
                className={
                  product.stock <= 0
                    ? "text-mkos-accent"
                    : product.stock < 10
                      ? "text-orange-800"
                      : "text-mkos-muted"
                }
              >
                {product.stock <= 0
                  ? "Sold out"
                  : product.stock < 10
                    ? `Only ${product.stock} left`
                    : "In stock"}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Button
              size="xl"
              variant="bag"
              cursor="ADD"
              disabled={product.stock <= 0}
              onClick={() => {
                if (product.stock <= 0) return;
                addItem(productToCartItem(product, { size, quantity: qty }));
                setAdded(true);
                openCart();
                setTimeout(() => setAdded(false), 1800);
              }}
            >
              {product.stock <= 0 ? (
                "Sold out"
              ) : added ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Added to bag
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 8h12l-1 12H7L6 8z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 8V7a3 3 0 016 0v1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add to bag
                </>
              )}
            </Button>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                href={product.stock <= 0 ? undefined : "/checkout"}
                size="lg"
                variant="checkout"
                className="w-full"
                cursor="EXPLORE"
                disabled={product.stock <= 0}
                onClick={() => {
                  if (product.stock <= 0) return;
                  addItem(productToCartItem(product, { size, quantity: qty }));
                }}
              >
                {product.stock <= 0 ? "Sold out" : "Buy now · Checkout"}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:min-w-[9.5rem]"
                onClick={() => toggleWish(product.id)}
                cursor=""
              >
                {wished ? "Saved" : "Wishlist"}
              </Button>
            </div>
          </div>

          <div className="mt-12 space-y-6 border-t border-mkos-border pt-8">
            <Detail title="Story" body={product.story} defaultOpen />
            <Detail
              title="Specifications"
              body={`${product.material}. Category: ${product.category}. Designed and finished in limited quantities.`}
            />
            <Detail
              title="Reviews"
              body={`Rated ${product.rating}/5 across ${product.reviews} verified client reviews. Fit runs true to size.`}
            />
          </div>
        </motion.div>
      </div>

      <div className="mx-auto mt-28 max-w-[1600px] px-5 lg:px-12">
        <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Frequently bought together
        </h2>
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-4">
            {[product, ...fbt].map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                {i > 0 && <span className="text-2xl text-mkos-silver">+</span>}
                <div className="relative h-36 w-28 overflow-hidden bg-mkos-warm">
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="112px" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="font-display text-xl tabular-nums">
              {formatPrice(product.price + fbt.reduce((n, p) => n + p.price, 0))}
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                addItem(productToCartItem(product, { size, quantity: 1 }));
                fbt.forEach((p) =>
                  addItem(
                    productToCartItem(p, {
                      size: p.sizes[0],
                      quantity: 1,
                    })
                  )
                );
              }}
            >
              Add all to bag
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-28 max-w-[1600px] px-5 lg:px-12">
        <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          You may also like
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>

      {recentProducts.length > 0 && (
        <div className="mx-auto mt-28 max-w-[1600px] px-5 lg:px-12">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Recently viewed
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {recentProducts.slice(0, 4).map((p, i) => (
              <ProductCard key={p!.id} product={p!} index={i} />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-mkos-ink/95 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreen(false)}
          >
            <button
              type="button"
              className="absolute top-6 right-6 font-display text-[11px] tracking-[0.22em] text-white uppercase"
            >
              Close
            </button>
            <div className="relative h-[80vh] w-full max-w-4xl">
              <Image
                src={product.images[active]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({
  title,
  body,
  defaultOpen = false,
}: {
  title: string;
  body: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 font-display text-[11px] tracking-[0.22em] uppercase"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-sm leading-relaxed text-mkos-muted"
          >
            <span className="block pb-2">{body}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
