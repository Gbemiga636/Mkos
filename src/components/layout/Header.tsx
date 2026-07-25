"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { useMagnetic } from "@/hooks/useMagnetic";
import { cn } from "@/lib/utils";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?collection=noir-edit", label: "Collections" },
  { href: "/#story", label: "Story" },
  { href: "/account", label: "Account" },
];

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const openCart = useCartStore((s) => s.open);
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const logoRef = useMagnetic<HTMLAnchorElement>(0.2);

  // White only over the homepage hero; everywhere else (or after scroll) = dark/normal
  const onHero = isHome && !pastHero;

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    const heroEnd = typeof window !== "undefined" ? window.innerHeight * 0.72 : 500;
    setPastHero(!isHome || latest > heroEnd);
    setHidden(latest > (isHome ? window.innerHeight : 120) && latest > prev);
  });

  useEffect(() => {
    setPastHero(
      !isHome ||
        scrollY.get() > (typeof window !== "undefined" ? window.innerHeight * 0.72 : 500)
    );
  }, [isHome, scrollY]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          pastHero || !isHome ? "glass border-b border-mkos-border" : "bg-transparent"
        )}
        animate={{ y: hidden && !menuOpen ? -100 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <nav className="hidden items-center gap-8 md:flex">
            {links.slice(0, 3).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "font-display text-[11px] tracking-[0.22em] uppercase transition-colors duration-500",
                  onHero
                    ? "text-white/85 hover:text-white"
                    : "text-mkos-ink/80 hover:text-mkos-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="flex flex-col gap-1.5 md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span
              className={cn(
                "h-px w-6 transition-colors duration-500",
                onHero ? "bg-white" : "bg-mkos-ink"
              )}
            />
            <span
              className={cn(
                "h-px w-4 transition-colors duration-500",
                onHero ? "bg-white" : "bg-mkos-ink"
              )}
            />
          </button>

          <Link
            href="/"
            ref={logoRef}
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="MKOS home"
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative"
            >
              <Image
                src="/logo/mkos-logo.png"
                alt="MKOS"
                width={120}
                height={48}
                priority
                className={cn(
                  "h-8 w-auto transition-[filter] duration-500 sm:h-10",
                  onHero ? "brightness-0 invert" : "brightness-0"
                )}
              />
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 rounded-full blur-xl transition-opacity duration-500",
                  onHero
                    ? "bg-[radial-gradient(circle,rgba(255,255,255,0.25),transparent_70%)]"
                    : "bg-[radial-gradient(circle,rgba(91,33,182,0.18),transparent_70%)]"
                )}
              />
            </motion.div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={cn(
                "font-display text-[11px] tracking-[0.22em] uppercase transition-colors duration-500",
                onHero ? "text-white/85 hover:text-white" : "text-mkos-ink"
              )}
              aria-label="Search"
            >
              Search
            </button>
            <button
              type="button"
              onClick={openCart}
              className={cn(
                "relative font-display text-[11px] tracking-[0.22em] uppercase transition-colors duration-500",
                onHero ? "text-white/85 hover:text-white" : "text-mkos-ink"
              )}
              aria-label={`Cart, ${itemCount} items`}
            >
              Bag
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute -top-2 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-body text-[9px]",
                      onHero ? "bg-white text-mkos-ink" : "bg-mkos-ink text-white"
                    )}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-mkos-ink text-white md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex h-20 items-center justify-between px-5">
              <Image
                src="/logo/mkos-logo.png"
                alt="MKOS"
                width={100}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="font-display text-[11px] tracking-[0.22em] uppercase"
              >
                Close
              </button>
            </div>
            <nav className="flex flex-col gap-6 px-5 pt-16">
              {[...links, { href: "/checkout", label: "Checkout" }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-display text-4xl font-medium tracking-tight"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
