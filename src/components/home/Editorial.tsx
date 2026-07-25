"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lines = [
  "We believe luxury is not louder.",
  "It is quieter, clearer, closer.",
  "Every MKOS piece begins with a question:",
  "What can we remove until only truth remains?",
];

export function EditorialStory() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".story-line").forEach((line, i) => {
        gsap.fromTo(
          line,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            delay: i * 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: line,
              start: "top 85%",
            },
          }
        );
      });

      gsap.fromTo(
        ".story-signature",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".story-signature",
            start: "top 90%",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mx-auto max-w-4xl text-center lg:text-left">
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
            Editorial
          </p>
          <div className="mt-8 space-y-4">
            {lines.map((line) => (
              <p
                key={line}
                className="story-line font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl"
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Stitched MKOS 1+2+3 as one signature — fits mobile */}
        <div className="story-signature mx-auto mt-14 w-full max-w-5xl sm:mt-20">
          <div className="relative mx-auto aspect-[2.3/1] w-full overflow-hidden bg-white">
            <Image
              src="/images/brand/mkos-signature.jpg"
              alt="MKOS — My Kind of Style"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 900px"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedVideo() {
  return (
    <section className="bg-mkos-warm px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="relative aspect-video overflow-hidden bg-mkos-ink">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/products/wa-3.jpg"
          >
            <source src="/videos/white-space.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-8 sm:p-12">
            <div className="text-white">
              <p className="font-display text-[11px] tracking-[0.35em] text-white/60 uppercase">
                Featured Film
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
                White Space
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
