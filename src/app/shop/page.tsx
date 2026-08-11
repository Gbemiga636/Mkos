"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import { EditableSection } from "@/components/cms/EditableSection";
import { cn } from "@/lib/utils";
import { useCms, useContent } from "@/lib/cms/CmsProvider";
import Link from "next/link";
import { RTW_CATEGORY_SLUGS } from "@/data/products";

const SHOP_CATEGORY_LABELS: Record<string, string> = {
  "women-rtw": "Women’s style",
  "men-rtw": "Men’s style",
  boubou: "Boubou",
};

function ShopContent() {
  const cms = useCms();
  const shop = useContent("shop");
  const products = cms.products;
  const categories = cms.categories;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState(params.get("category") ?? "");
  const [filter, setFilter] = useState(params.get("filter") ?? "");
  const [sort, setSort] = useState("featured");
  const [priceMax, setPriceMax] = useState(800);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availability, setAvailability] = useState<"all" | "in">("all");

  const rtwCategories = useMemo(
    () => categories.filter((c) => (RTW_CATEGORY_SLUGS as readonly string[]).includes(c.slug)),
    [categories]
  );

  // Keep filters in sync when navigating via header / collection cards / browser back
  useEffect(() => {
    const col = params.get("collection") ?? "";
    if (col === "bespoke") {
      router.replace("/bespoke");
      return;
    }
    if (col === "bridal") {
      router.replace("/bridal");
      return;
    }
    setCategory(params.get("category") ?? "");
    setFilter(params.get("filter") ?? "");
  }, [params, router]);

  function writeQuery(next: { category?: string; filter?: string }) {
    const q = new URLSearchParams();
    const cat = next.category ?? "";
    const f = next.filter ?? "";
    if (cat) q.set("category", cat);
    if (f) q.set("filter", f);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function selectCategory(slug: string) {
    const next = category === slug ? "" : slug;
    setCategory(next);
    writeQuery({ category: next, filter });
  }

  function clearAll() {
    setCategory("");
    setFilter("");
    writeQuery({ category: "", filter: "" });
  }

  const filtered = useMemo(() => {
    const usdOf = (p: (typeof products)[number]) =>
      p.priceUsd != null && p.priceUsd > 0 ? p.priceUsd : p.price / 1500;

    let list = products.filter((p) => p.collection === "ready-to-wear" || !p.collection);
    if (category) list = list.filter((p) => p.category === category);
    if (filter === "new") list = list.filter((p) => p.newArrival);
    if (filter === "bestsellers") list = list.filter((p) => p.bestSeller);
    if (filter === "trending") list = list.filter((p) => p.trending);
    list = list.filter((p) => usdOf(p) <= priceMax);
    if (availability === "in") list = list.filter((p) => p.stock > 0);

    if (sort === "price-asc") list.sort((a, b) => usdOf(a) - usdOf(b));
    if (sort === "price-desc") list.sort((a, b) => usdOf(b) - usdOf(a));
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, category, filter, sort, priceMax, availability]);

  const activeCategoryName =
    category ?
      SHOP_CATEGORY_LABELS[category] ||
      categories.find((c) => c.slug === category)?.name ||
      null
    : null;

  return (
    <div className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <EditableSection cmsKey="shop" label="Shop header">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              {shop?.eyebrow ?? "Shop"}
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
              {activeCategoryName || shop?.title || "The MKoS collections."}
            </h1>
          </motion.div>
        </EditableSection>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-mkos-border py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="font-display text-[11px] tracking-[0.22em] uppercase"
          >
            Filters
          </button>
          <p className="text-sm text-mkos-muted">{filtered.length} styles</p>
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

        <div className="mt-6">
          <p className="mb-2 font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
            Filter
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!category && !filter} onClick={clearAll}>
              All
            </Chip>
            {rtwCategories.map((c) => (
              <Chip
                key={c.slug}
                active={category === c.slug}
                onClick={() => selectCategory(c.slug)}
              >
                {SHOP_CATEGORY_LABELS[c.slug] || c.name}
              </Chip>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i % 8} />
            ))}
          </div>
        ) : (
          <div className="mt-16 max-w-lg border border-mkos-border bg-mkos-warm/40 px-6 py-10">
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              {activeCategoryName || "Shop"}
            </p>
            <h2 className="mt-3 font-display text-2xl font-medium tracking-tight">
              Styles for this selection are being prepared
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
              Try Ready-to-Wear, or start a Bespoke / Custom Wear request with the house.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/bespoke"
                className="inline-flex h-11 items-center bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase"
              >
                Bespoke / Custom Wear
              </Link>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-11 items-center border border-mkos-border px-5 font-display text-[10px] tracking-[0.18em] uppercase"
              >
                View all styles
              </button>
            </div>
          </div>
        )}
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
                    min={50}
                    max={800}
                    step={10}
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-orange-700"
                  />
                  <p className="mt-2 text-sm text-mkos-muted">
                    Up to ${priceMax.toLocaleString("en-US")}
                  </p>
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
                    <Chip
                      active={filter === "new"}
                      onClick={() => {
                        const next = filter === "new" ? "" : "new";
                        setFilter(next);
                        writeQuery({ category, filter: next });
                      }}
                    >
                      New
                    </Chip>
                    <Chip
                      active={filter === "bestsellers"}
                      onClick={() => {
                        const next = filter === "bestsellers" ? "" : "bestsellers";
                        setFilter(next);
                        writeQuery({ category, filter: next });
                      }}
                    >
                      Bestsellers
                    </Chip>
                    <Chip
                      active={filter === "trending"}
                      onClick={() => {
                        const next = filter === "trending" ? "" : "trending";
                        setFilter(next);
                        writeQuery({ category, filter: next });
                      }}
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
        active
          ? "border-mkos-ink bg-mkos-ink text-white"
          : "border-mkos-border hover:border-mkos-ink/40"
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
