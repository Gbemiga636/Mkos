"use client";

import { products } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading, Button } from "@/components/ui/Button";

export function NewArrivals() {
  const items = products.filter((p) => p.newArrival).slice(0, 4);

  return (
    <section className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="New Arrivals"
            title="Just arrived from the atelier."
            subtitle="Fresh cuts, quiet finishes, and the pieces that define this season’s silhouette."
          />
          <Button href="/shop?filter=new" variant="secondary">
            View all
          </Button>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Trending() {
  const items = products.filter((p) => p.trending).slice(0, 4);

  return (
    <section className="overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow="Trending"
          title="What the house is wearing."
          subtitle="The most sought-after silhouettes this month — chosen by clients, not algorithms alone."
          align="center"
        />
        <div className="mt-14 grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} variant="editorial" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BestSellers() {
  const items = products.filter((p) => p.bestSeller).slice(0, 4);

  return (
    <section className="bg-mkos-ink px-5 py-28 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[11px] tracking-[0.35em] text-white/50 uppercase">
              Best Sellers
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
              The pieces that never leave.
            </h2>
          </div>
          <Button href="/shop?filter=bestsellers" variant="outline">
            Shop bestsellers
          </Button>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {items.map((p, i) => (
            <div key={p.id} className="[&_h3]:text-white [&_p]:text-white/60 [&_.glass]:bg-white/10">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
