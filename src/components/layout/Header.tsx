"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useCms } from "@/lib/cms/CmsProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { navigation, settings } = useCms();
  const { user, loading: authLoading } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  // One entry per href — hide Style Brief from the menu for now
  const links = (() => {
    const seen = new Set<string>();
    return navigation
      .filter(
        (l) =>
          l.location === "header" &&
          !l.href.includes("/account") &&
          l.href !== "/checkout" &&
          l.href !== "/style-brief"
      )
      .filter((l) => {
        if (seen.has(l.href)) return false;
        seen.add(l.href);
        return true;
      });
  })();
  const menuLinks = (() => {
    return [
      ...links,
      user
        ? { href: "/account", label: "Account", location: "header" as const }
        : { href: "#signin", label: "Sign in", location: "header" as const },
      { href: "/checkout", label: "Checkout", location: "header" as const },
    ];
  })();
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const openCart = useCartStore((s) => s.open);
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const logoRef = useMagnetic<HTMLAnchorElement>(0.2);

  const onHero = isHome && !pastHero;
  const iconBtn = cn(
    "grid h-10 w-10 place-items-center transition-colors duration-500",
    onHero ? "text-white/90 hover:text-white" : "text-mkos-ink/85 hover:text-mkos-ink"
  );

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

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 md:h-24 lg:px-12">
          <button
            type="button"
            className="relative z-10 flex flex-col gap-1.5"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span
              className={cn(
                "h-px w-7 transition-colors duration-500",
                onHero ? "bg-white" : "bg-mkos-ink"
              )}
            />
            <span
              className={cn(
                "h-px w-5 transition-colors duration-500",
                onHero ? "bg-white" : "bg-mkos-ink"
              )}
            />
            <span className="sr-only">Menu</span>
          </button>

          <Link
            href="/"
            ref={logoRef}
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="MKoS home"
          >
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Image
                src={settings.logo_url ?? "/logo/mkos-logo.png"}
                alt={settings.brand_name}
                width={160}
                height={64}
                priority
                className={cn(
                  "h-11 w-auto transition-[filter] duration-500 sm:h-12 md:h-14",
                  onHero ? "brightness-0 invert" : "brightness-0"
                )}
              />
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 rounded-full blur-xl transition-opacity duration-500",
                  onHero
                    ? "bg-[radial-gradient(circle,rgba(255,255,255,0.25),transparent_70%)]"
                    : "bg-[radial-gradient(circle,rgba(196,92,38,0.18),transparent_70%)]"
                )}
              />
            </motion.div>
          </Link>

          <div className="relative z-10 flex items-center gap-1 sm:gap-2">
            <motion.button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={iconBtn}
              aria-label="Search"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-[15px] w-[15px]" />
            </motion.button>
            {!authLoading &&
              (user ? (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                  <Link href="/account" className={iconBtn} aria-label="Account">
                    <FontAwesomeIcon icon={faUser} className="h-[15px] w-[15px]" />
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className={iconBtn}
                  aria-label="Sign in"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FontAwesomeIcon icon={faUser} className="h-[15px] w-[15px]" />
                </motion.button>
              ))}
            <motion.button
              type="button"
              onClick={openCart}
              className={cn(iconBtn, "relative")}
              aria-label={`Bag, ${itemCount} items`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <FontAwesomeIcon icon={faBagShopping} className="h-[15px] w-[15px]" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-body text-[9px]",
                      onHero ? "bg-white text-mkos-ink" : "bg-mkos-accent text-white"
                    )}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-mkos-ink text-white"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="mx-auto flex h-20 w-full max-w-[1600px] shrink-0 items-center justify-between px-5 sm:px-8 md:h-24 lg:px-12">
              <Image
                src={settings.logo_url ?? "/logo/mkos-logo.png"}
                alt={settings.brand_name}
                width={160}
                height={64}
                className="h-11 w-auto brightness-0 invert sm:h-12 md:h-14"
              />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="font-display text-[11px] tracking-[0.22em] uppercase"
              >
                Close
              </button>
            </div>
            <nav
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-16 pt-10 sm:px-8 md:px-12 md:pt-16 [-webkit-overflow-scrolling:touch]"
            >
              <div className="mx-auto flex max-w-[1600px] flex-col gap-6 md:max-w-3xl md:gap-8">
                {menuLinks.map((l, i) => (
                  <motion.div
                    key={`${l.href}-${l.label}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                  >
                    {l.href === "#signin" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openAuth("signin");
                        }}
                        className="font-display text-4xl font-medium tracking-tight md:text-6xl"
                      >
                        {l.label}
                      </button>
                    ) : (
                      <Link
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className="font-display text-4xl font-medium tracking-tight md:text-6xl"
                      >
                        {l.label}
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
