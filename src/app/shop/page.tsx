"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { products, categories, collections } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

function ShopContent() {
  const params = useSearchParams();
  const initialCollection = params.get("collection") ?? "";
  const initialCategory = params.get("category") ?? "";
  const initialFilter = params.get("filter") ?? "";

  const [collection, setCollection] = useState(initialCollection);
  const [category, setCategory] = useState(initialCategory);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState("featured");
  const [priceMax, setPriceMax] = useState(1000000);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [color, setColor] = useState("");
  const [availability, setAvailability] = useState<"all" | "in">("all");

  const filtered = useMemo(() => {
    let list = [...products];
    if (collection) list = list.filter((p) => p.collection === collection);
    if (category) list = list.filter((p) => p.category === category);
    if (filter === "new") list = list.filter((p) => p.newArrival);
    if (filter === "bestsellers") list = list.filter((p) => p.bestSeller);
    if (filter === "trending") list = list.filter((p) => p.trending);
    list = list.filter((p) => p.price <= priceMax);
    if (color) list = list.filter((p) => p.colors.some((c) => c.name.toLowerCase().includes(color.toLowerCase())));
    if (availability === "in") list = list.filter((p) => p.stock > 0);

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [collection, category, filter, sort, priceMax, color, availability]);

  return (
    <div className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">Shop</p>
          <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
            The full archive.
          </h1>
          <p className="mt-4 max-w-xl text-mkos-muted">
            Filter by instinct. Every piece is finished by hand and ready for the wardrobe.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-mkos-border py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="font-display text-[11px] tracking-[0.22em] uppercase"
          >
            Filters
          </button>
          <p className="text-sm text-mkos-muted">{filtered.length} pieces</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border-none bg-transparent font-display text-[11px] tracking-[0.18em] uppercase outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={!collection && !category && !filter} onClick={() => { setCollection(""); setCategory(""); setFilter(""); }}>
            All
          </Chip>
          {collections.map((c) => (
            <Chip key={c.slug} active={collection === c.slug} onClick={() => setCollection(c.slug)}>
              {c.name}
            </Chip>
          ))}
          {categories.map((c) => (
            <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i % 8} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[70] bg-mkos-ink/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 z-[71] flex h-full w-full max-w-sm flex-col bg-white shadow-lift"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between border-b border-mkos-border px-6 py-5">
                <p className="font-display text-[11px] tracking-[0.28em] uppercase">Filters</p>
                <button type="button" onClick={() => setFiltersOpen(false)} className="text-sm">
                  Close
                </button>
              </div>
              <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8">
                <FilterGroup label="Price">
                  <input
                    type="range"
                    min={100000}
                    max={1000000}
                    step={10000}
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-violet-700"
                  />
                  <p className="mt-2 text-sm text-mkos-muted">Up to ₦{priceMax.toLocaleString("en-NG")}</p>
                </FilterGroup>
                <FilterGroup label="Color">
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Black, Ivory"
                    className="h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                  />
                </FilterGroup>
                <FilterGroup label="Availability">
                  <div className="flex gap-2">
                    <Chip active={availability === "all"} onClick={() => setAvailability("all")}>
                      All
                    </Chip>
                    <Chip active={availability === "in"} onClick={() => setAvailability("in")}>
                      In stock
                    </Chip>
                  </div>
                </FilterGroup>
                <FilterGroup label="Quick">
                  <div className="flex flex-wrap gap-2">
                    <Chip active={filter === "new"} onClick={() => setFilter(filter === "new" ? "" : "new")}>
                      New
                    </Chip>
                    <Chip
                      active={filter === "bestsellers"}
                      onClick={() => setFilter(filter === "bestsellers" ? "" : "bestsellers")}
                    >
                      Bestsellers
                    </Chip>
                    <Chip
                      active={filter === "trending"}
                      onClick={() => setFilter(filter === "trending" ? "" : "trending")}
                    >
                      Trending
                    </Chip>
                  </div>
                </FilterGroup>
              </div>
              <div className="border-t border-mkos-border p-6">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="h-12 w-full bg-mkos-ink font-display text-[11px] tracking-[0.22em] text-white uppercase"
                >
                  Show {filtered.length} results
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-4 py-2 font-display text-[10px] tracking-[0.18em] uppercase transition-colors",
        active ? "border-mkos-ink bg-mkos-ink text-white" : "border-mkos-border hover:border-mkos-ink/40"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28" />}>
      <ShopContent />
    </Suspense>
  );
}
