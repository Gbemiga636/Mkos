"use client";

import Image from "next/image";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { useContent } from "@/lib/cms/CmsProvider";

export function EditorialStory() {
  const editorial = useContent("editorial");
  const lines = (() => {
    const fromCms = editorial?.extra?.lines as string[] | undefined;
    if (fromCms?.some((l) => /MASTER|Understand STYLE/i.test(l))) return fromCms;
    return [
      "For Those Who Understand STYLE.",
      "MKoS defines who we are.",
      "MASTER defines how we work.",
      "Together—the MKoS MASTER Standard.",
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

export function FeaturedVideo() {
  const section = useContent("featured_video");

  return (
    <section className="bg-mkos-warm px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <ScrollReveal y={48}>
          <div className="relative aspect-video overflow-hidden bg-black">
            <AutoplayVideo
              src={section?.media_url ?? "/videos/white-space.mp4"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-8 sm:p-12">
              <div className="text-white">
                <p className="font-display text-[11px] tracking-[0.35em] text-white/60 uppercase">
                  {section?.eyebrow ?? "Featured Film"}
                </p>
                <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
                  {section?.title ?? "White Space"}
                </h2>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
