"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { categories, products, reviews, faqs } from "@/data/products";
import { SectionHeading, Button } from "@/components/ui/Button";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { useState } from "react";

export function CollectionCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const cursor = useCursorLabel("DRAG");

  const slides = [
    { src: "/images/products/wa-1.jpg", name: "Atelier '25", href: "/shop?collection=atelier-25" },
    { src: "/images/products/wa-2.jpg", name: "Noir Edit", href: "/shop?collection=noir-edit" },
    { src: "/images/products/wa-3.jpg", name: "White Space", href: "/shop?collection=white-space" },
    { src: "/images/products/wa-4.jpg", name: "Evening", href: "/shop?filter=new" },
    { src: "/images/products/wa-5.jpg", name: "Essentials", href: "/shop?category=essentials" },
  ];

  return (
    <section ref={ref} className="overflow-hidden bg-white py-28">
      <div className="px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Collection Carousel"
          title="Move through the house."
          subtitle="A horizontal procession of edits — scroll to wander the season."
        />
      </div>
      <motion.div style={{ x }} className="mt-14 flex w-max gap-6 px-5 sm:px-8" {...cursor}>
        {[...slides, ...slides].map((c, i) => (
          <Link
            key={`${c.name}-${i}`}
            href={c.href}
            className="relative block h-[420px] w-[320px] overflow-hidden sm:h-[520px] sm:w-[400px]"
          >
            <Image src={c.src} alt={c.name} fill className="object-cover" sizes="400px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
              <p className="font-display text-2xl">{c.name}</p>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}

export function CategoryGrid() {
  const cursor = useCursorLabel("VIEW");

  return (
    <section className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow="Categories"
          title="Find your silhouette."
          subtitle="Four paths into the archive. Choose by instinct."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {categories.map((cat, i) => {
            const img = products[i * 2]?.images[0] ?? products[0].images[0];
            return (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group relative flex min-h-[280px] items-end overflow-hidden bg-white p-8 sm:min-h-[340px]"
                {...cursor}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20" />
                <div className="relative z-10">
                  <p className="font-display text-[10px] tracking-[0.3em] text-mkos-muted uppercase">
                    0{i + 1}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                    {cat.name}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-mkos-muted">{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  return (
    <section id="story" className="relative overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1600px] gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm sm:aspect-[4/5]">
          <Image
            src="/images/products/wa-2.jpg"
            alt="MKOS brand"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>
        <div>
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
            Brand Story
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
            Built for those who notice everything.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mkos-muted sm:text-lg">
            MKOS was founded on a simple obsession: clothing that feels inevitable. We work with
            small ateliers, rare mills, and a design language that privileges silence over spectacle.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-mkos-muted sm:text-lg">
            Every seam is a decision. Every fabric is a conversation. The result is a wardrobe that
            doesn&apos;t ask for attention — it earns it.
          </p>
          <Button href="/shop" className="mt-10" variant="secondary">
            Discover the house
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section className="bg-mkos-ink px-5 py-28 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          eyebrow="Client Voices"
          title="Whispers from the wardrobe."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r, i) => (
            <motion.blockquote
              key={r.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="flex gap-1 text-violet-300">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/80">&ldquo;{r.text}&rdquo;</p>
              <footer className="mt-6">
                <p className="font-display text-sm">{r.name}</p>
                <p className="mt-1 text-xs text-white/40">
                  {r.location} · {r.product}
                </p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InstagramGallery() {
  const images = products.slice(0, 6).map((p) => p.images[0]);
  const cursor = useCursorLabel("VIEW");

  return (
    <section className="bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="@mkos"
            title="Life in the edit."
            subtitle="A living gallery of clients, campaigns, and atelier moments."
          />
          <Button href="#" variant="secondary">
            Follow
          </Button>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((src, i) => (
            <motion.a
              key={src}
              href="#"
              className="group relative aspect-square overflow-hidden bg-mkos-warm"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              {...cursor}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-violet-950/0 transition-colors duration-500 group-hover:bg-violet-950/25" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12">
      <div className="absolute inset-0 gradient-purple opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
      <div className="relative mx-auto max-w-3xl text-center text-white">
        <p className="font-display text-[11px] tracking-[0.35em] text-white/60 uppercase">
          Newsletter
        </p>
        <h2 className="mt-5 font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
          Early access. Private drops.
        </h2>
        <p className="mt-4 text-white/70">
          Join a restrained list for atelier releases, fittings, and first looks.
        </p>
        <form
          className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setDone(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="h-14 flex-1 border border-white/25 bg-white/10 px-5 text-white outline-none backdrop-blur-sm placeholder:text-white/50 focus:border-white/60"
          />
          <Button type="submit" size="lg" variant="secondary" className="bg-white text-mkos-ink">
            {done ? "Welcome" : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-mkos-warm px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers, quietly delivered."
          subtitle="Everything you need before — and after — you join the house."
        />
        <div className="divide-y divide-mkos-border border-y border-mkos-border">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-6 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg sm:text-xl">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="text-2xl leading-none"
                  >
                    +
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-sm leading-relaxed text-mkos-muted sm:text-base">
                    {item.a}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const text = "MKOS · QUIET LUXURY · ATELIER · ESSENTIAL · ";
  return (
    <div className="overflow-hidden border-y border-mkos-border bg-white py-4">
      <motion.div
        className="flex whitespace-nowrap font-display text-sm tracking-[0.35em] text-mkos-muted uppercase"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <span>{text.repeat(8)}</span>
        <span>{text.repeat(8)}</span>
      </motion.div>
    </div>
  );
}
