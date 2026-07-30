"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/cms/types";
import { useFormatPrice } from "@/lib/cms/CmsProvider";
import { useWishlistStore } from "@/store/wishlist";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { objectPositionCss } from "@/lib/media/imageFocus";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  index = 0,
  variant = "default",
}: {
  product: Product;
  index?: number;
  variant?: "default" | "editorial" | "compact";
}) {
  const formatPrice = useFormatPrice();
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const cursor = useCursorLabel("VIEW");

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 });
  };

  return (
    <ScrollReveal
      as="article"
      y={40}
      delay={index * 70}
      className={cn("group relative", variant === "editorial" && "md:pt-12")}
    >
    <div
      onMouseEnter={() => {
        setHovered(true);
        cursor.onMouseEnter();
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
        cursor.onMouseLeave();
      }}
      onMouseMove={onMove}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <motion.div
          className="relative aspect-[3/4] overflow-hidden bg-mkos-warm"
          animate={{
            rotateX: tilt.x,
            rotateY: tilt.y,
            y: hovered ? -12 : 0,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          style={{ transformPerspective: 900, transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: hovered ? 1.1 : 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              style={{ objectPosition: objectPositionCss(product.imageFocus?.[0]) }}
            />
          </motion.div>

          {product.images[1] && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={product.images[1]}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                style={{ objectPosition: objectPositionCss(product.imageFocus?.[1]) }}
              />
            </motion.div>
          )}

          {/* glass reflection */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
            animate={{ x: hovered ? "30%" : "-40%", opacity: hovered ? 0.5 : 0.2 }}
            transition={{ duration: 0.8 }}
          />

          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              type="button"
              data-no-nav
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(product.id);
              }}
              className="glass flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={wished ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                animate={wished ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                className={wished ? "text-orange-700" : "text-mkos-ink"}
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </motion.svg>
            </button>
          </div>

          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-x-3 bottom-3 z-10"
              >
                <div className="glass rounded-sm px-4 py-3 text-center font-display text-[10px] tracking-[0.25em] uppercase">
                  Quick View
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(product.newArrival || product.bestSeller || product.stock <= 0) && (
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
              {product.stock <= 0 ? (
                <span className="bg-mkos-ink px-3 py-1 font-display text-[9px] tracking-[0.2em] text-white uppercase">
                  Sold out
                </span>
              ) : (
                <span className="glass rounded-full px-3 py-1 font-display text-[9px] tracking-[0.2em] uppercase">
                  {product.newArrival ? "New" : "Best"}
                </span>
              )}
            </div>
          )}
        </motion.div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
              {product.collection.replace("-", " ")}
            </p>
            <h3 className="mt-1 font-display text-base font-medium tracking-tight sm:text-lg">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-mkos-muted">{product.tagline}</p>
          </div>
          <motion.p
            className="font-display text-sm tabular-nums"
            animate={{ y: hovered ? -2 : 0, color: hovered ? "#c45c26" : "#111111" }}
          >
            {formatPrice(product.price)}
          </motion.p>
        </div>
      </Link>
    </div>
    </ScrollReveal>
  );
}
