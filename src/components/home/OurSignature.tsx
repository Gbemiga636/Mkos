"use client";

import { ScrollReveal } from "@/components/experience/ScrollReveal";

export function OurSignature() {
  return (
    <section id="our-signature" className="relative overflow-hidden bg-white px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left_top,rgba(196,92,38,0.07),transparent_55%)]" />
      <div className="relative mx-auto max-w-[1600px]">
        <div className="max-w-3xl text-left">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Our Signature
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={60}>
            <h2 className="mt-5 font-display text-3xl leading-[1.12] font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Where authentic Aso Oke meets signature denim—an iconic expression of African
              heritage reimagined through contemporary design.
            </h2>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
