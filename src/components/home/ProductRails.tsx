"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading, Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useCms, useContent } from "@/lib/cms/CmsProvider";

export function NewArrivals() {
  const { products } = useCms();
  const section = useContent("new_arrivals");
  const items = products.filter((p) => p.newArrival).slice(0, 4);

  return (
    <section className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={section?.eyebrow ?? "New Arrivals"}
            title={section?.title ?? "Just arrived from the atelier."}
            subtitle={section?.subtitle ?? undefined}
          />
          <ScrollReveal y={20} delay={120}>
            <Button href="/shop?filter=new" variant="secondary">
              View all
            </Button>
          </ScrollReveal>
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
  const { products } = useCms();
  const section = useContent("trending");
  const items = products.filter((p) => p.trending).slice(0, 4);

  return (
    <section className="overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow={section?.eyebrow ?? "Trending"}
          title={section?.title ?? "What the house is wearing."}
          subtitle={section?.subtitle ?? undefined}
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
  const { products } = useCms();
  const section = useContent("best_sellers");
  const items = products.filter((p) => p.bestSeller).slice(0, 4);

  return (
    <section className="bg-mkos-ink px-5 py-28 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <ScrollReveal y={20}>
              <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
                {section?.eyebrow ?? "Best Sellers"}
              </p>
            </ScrollReveal>
            <ScrollReveal y={36} delay={80}>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
                {section?.title ?? "The styles that never leave."}
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal y={20} delay={120}>
            <Button href="/shop?filter=bestsellers" variant="outline">
              Shop bestsellers
            </Button>
          </ScrollReveal>
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
