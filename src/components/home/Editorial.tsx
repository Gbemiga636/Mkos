"use client";

import Image from "next/image";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { BrandText } from "@/components/ui/BrandText";
import { useContent } from "@/lib/cms/CmsProvider";

export function EditorialStory() {
  const editorial = useContent("editorial");
  const lines = (() => {
    const fromCms = editorial?.extra?.lines as string[] | undefined;
    if (fromCms?.length) return fromCms;
    return [
      "Timeless by design.",
      "MKoS fashion moves with time,",
      "revisiting trends with intention.",
    ];
  })();

  return (
    <section className="relative overflow-hidden bg-white px-5 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="mx-auto max-w-4xl text-center lg:text-left">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              {editorial?.eyebrow ?? "Editorial"}
            </p>
          </ScrollReveal>
          <div className="mt-8 space-y-4">
            {lines.map((line, i) => (
              <ScrollReveal key={line} y={36} delay={i * 90}>
                <p className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl">
                  {line}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal y={48} delay={120} className="mx-auto mt-14 w-full max-w-5xl sm:mt-20">
          <div className="relative mx-auto aspect-[2.3/1] w-full overflow-hidden bg-white">
            <Image
              src={editorial?.media_url ?? "/images/brand/mkos-signature.jpg"}
              alt="MKoS — My Kind of Style"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const MOTION_VIDEO = "/videos/mkos-in-motion.mp4";

export function FeaturedVideo() {
  const section = useContent("featured_video");
  // Always use the MKoS in motion film for Featured Film
  const src =
    section?.media_url && /mkos-in-motion/i.test(section.media_url)
      ? section.media_url
      : MOTION_VIDEO;

  return (
    <section className="relative min-h-[88svh] overflow-hidden bg-mkos-ink text-white lg:min-h-[100svh]">
      <div className="absolute inset-0">
        <AutoplayVideo
          src={src}
          whenVisible
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-[1600px] flex-col justify-end px-5 pb-16 pt-32 sm:px-8 lg:min-h-[100svh] lg:px-12 lg:pb-24">
        <ScrollReveal y={28}>
          <h2 className="max-w-2xl font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
            <BrandText>{section?.title ?? "MKoS in motion"}</BrandText>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
            {section?.subtitle ??
              "A quiet look at the house — then step into the Experience."}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
