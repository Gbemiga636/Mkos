"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useCms } from "@/lib/cms/CmsProvider";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("?")[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { navigation, settings } = useCms();

  const links = useMemo(() => {
    const seen = new Set<string>();
    const fromCms = navigation
      .filter(
        (l) =>
          l.location === "header" &&
          !l.href.includes("/account") &&
          l.href !== "/checkout" &&
          l.href !== "/style-brief" &&
          l.href !== "#signin" &&
          l.label.toLowerCase() !== "sign in" &&
          l.label.toLowerCase() !== "account" &&
          l.label.toLowerCase() !== "bridal" &&
          l.label.toLowerCase() !== "journal" &&
          l.label.toLowerCase() !== "shop" &&
          !l.href.includes("collection=bridal") &&
          l.href !== "/blog" &&
          l.href !== "/shop"
      )
      .map((l) =>
        l.href === "/about" && /^story$/i.test(l.label) ? { ...l, label: "Who we are" } : l
      )
      .filter((l) => {
        if (seen.has(l.href)) return false;
        seen.add(l.href);
        return true;
      });

    const hasHome = fromCms.some((l) => l.href === "/");
    return hasHome
      ? fromCms
      : [{ label: "Home", href: "/", location: "header" as const }, ...fromCms];
  }, [navigation]);

  const menuLinks = [
    ...links,
    { href: "/checkout", label: "Checkout", location: "header" as const },
  ];

  const [pastHero, setPastHero] = useState(() => !isHome);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const openCart = useCartStore((s) => s.open);
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const logoRef = useMagnetic<HTMLAnchorElement>(0.2);

  const onHero = isHome && !pastHero;
  /** Laptop+: show clear page links once past hero (or on any non-home page). */
  const showDesktopNav = !onHero;
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
        <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between gap-4 px-5 sm:h-28 sm:px-8 lg:h-32 lg:gap-8 lg:px-12">
          <Link href="/" ref={logoRef} className="relative z-10 shrink-0" aria-label="MKoS home">
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Image
                src={settings.logo_url ?? "/logo/mkos-logo.png"}
                alt={settings.brand_name}
                width={320}
                height={128}
                priority
                className={cn(
                  "w-auto transition-[filter,height] duration-500",
                  showDesktopNav
                    ? "h-16 sm:h-16 lg:h-[4.5rem]"
                    : "h-[4.5rem] sm:h-20 md:h-24 lg:h-28",
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

          <AnimatePresence>
            {showDesktopNav && (
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-1/2 top-1/2 z-10 hidden max-w-[min(58vw,720px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-x-5 gap-y-1 overflow-x-auto lg:flex xl:gap-x-7"
                aria-label="Primary"
              >
                {links.map((l) => {
                  const active = isActivePath(pathname, l.href);
                  return (
                    <Link
                      key={`${l.href}-${l.label}`}
                      href={l.href}
                      className={cn(
                        "shrink-0 whitespace-nowrap font-display text-[11px] tracking-[0.18em] uppercase transition-colors duration-300",
                        active
                          ? "text-mkos-ink"
                          : "text-mkos-ink/55 hover:text-mkos-ink"
                      )}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-2">
            <motion.button
              type="button"
              onClick={openCart}
              className={cn(iconBtn, "relative")}
              aria-label={`Bag, ${itemCount} items`}
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

            <motion.button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={iconBtn}
              aria-label="Search"
              whileTap={{ scale: 0.94 }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-[15px] w-[15px]" />
            </motion.button>

            {/* Hamburger stays on mobile; on laptop only while still on the home hero */}
            <button
              type="button"
              className={cn(iconBtn, "relative", showDesktopNav && "lg:hidden")}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span className="flex w-[22px] flex-col gap-[5px]" aria-hidden>
                <span
                  className={cn(
                    "block h-[1.5px] w-full rounded-full transition-colors duration-500",
                    onHero ? "bg-white" : "bg-mkos-ink"
                  )}
                />
                <span
                  className={cn(
                    "block h-[1.5px] w-full rounded-full transition-colors duration-500",
                    onHero ? "bg-white" : "bg-mkos-ink"
                  )}
                />
                <span
                  className={cn(
                    "block h-[1.5px] w-full rounded-full transition-colors duration-500",
                    onHero ? "bg-white" : "bg-mkos-ink"
                  )}
                />
              </span>
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[61] flex w-full flex-col bg-mkos-ink text-white shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.55)] md:w-1/2 lg:max-w-[640px]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-24 shrink-0 items-center justify-between px-5 sm:h-28 sm:px-8 lg:h-32 lg:px-10">
                <Image
                  src={settings.logo_url ?? "/logo/mkos-logo.png"}
                  alt={settings.brand_name}
                  width={200}
                  height={80}
                  className="h-12 w-auto brightness-0 invert sm:h-14"
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
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-16 pt-8 sm:px-8 md:px-10 md:pt-12 [-webkit-overflow-scrolling:touch]"
              >
                <div className="flex flex-col gap-5 md:gap-7">
                  {menuLinks.map((l, i) => (
                    <motion.div
                      key={`${l.href}-${l.label}`}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05 }}
                    >
                      <Link
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl"
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
