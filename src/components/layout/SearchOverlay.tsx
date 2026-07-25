"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/store/ui";
import { useCms, useFormatPrice } from "@/lib/cms/CmsProvider";

const trending = ["Wool Coat", "Cashmere", "Silk", "White Shirt", "Leather Tote"];

export function SearchOverlay() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const { products, categories } = useCms();
  const formatPrice = useFormatPrice();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("mkos-recent-searches");
    if (stored) setRecent(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.category.includes(q) ||
        p.collection.includes(q)
    );
  }, [query]);

  const commitSearch = (value: string) => {
    if (!value.trim()) return;
    const next = [value, ...recent.filter((r) => r !== value)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("mkos-recent-searches", JSON.stringify(next));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-mkos-ink/40 backdrop-blur-md"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
            className="relative mx-auto max-h-[92vh] max-w-5xl overflow-y-auto bg-white px-5 pt-10 pb-16 shadow-lift sm:px-10"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-display text-[11px] tracking-[0.3em] text-mkos-muted uppercase">
                Search
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-display text-[11px] tracking-[0.22em] uppercase"
              >
                Close
              </button>
            </div>

            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch(query);
              }}
              placeholder="What are you looking for?"
              className="mt-8 w-full border-b border-mkos-ink/15 bg-transparent pb-4 font-display text-3xl outline-none placeholder:text-mkos-silver sm:text-5xl"
            />

            {!query && (
              <div className="mt-12 grid gap-12 md:grid-cols-2">
                <div>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                    Recent
                  </p>
                  <ul className="mt-4 space-y-3">
                    {(recent.length ? recent : ["Try “silk” or “coat”"]).map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => setQuery(r)}
                          className="text-lg text-mkos-ink/80 transition-colors hover:text-mkos-ink"
                        >
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                    Trending
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trending.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQuery(t)}
                        className="border border-mkos-border px-4 py-2 font-display text-[11px] tracking-[0.18em] uppercase transition-colors hover:border-mkos-ink"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="mt-8 font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                    Categories
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop?category=${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-sm hover:text-orange-800"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {query && (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {results.length === 0 && (
                  <p className="text-mkos-muted">No pieces found for “{query}”.</p>
                )}
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={() => {
                      commitSearch(query);
                      setOpen(false);
                    }}
                    className="group flex gap-4 border border-transparent p-3 transition-colors hover:border-mkos-border hover:bg-mkos-warm"
                  >
                    <div className="relative h-24 w-20 overflow-hidden bg-mkos-warm">
                      <Image src={p.images[0]} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                    <div>
                      <p className="font-display text-lg">{p.name}</p>
                      <p className="mt-1 text-sm text-mkos-muted">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
