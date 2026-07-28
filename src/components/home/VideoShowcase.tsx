"use client";

import Link from "next/link";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { EditableSection } from "@/components/cms/EditableSection";
import { useContent } from "@/lib/cms/CmsProvider";

export function VideoShowcase() {
  const experience = useContent("experience_video");
  const bespoke = useContent("bespoke_video");

  const cards = [
    {
      cmsKey: "experience_video",
      href: experience?.cta_href ?? "/experience",
      video: experience?.media_url ?? "/videos/experience-1.mp4",
      eyebrow: experience?.subtitle ?? "Step inside the house.",
      title: experience?.title ?? "Experience with you",
    },
    {
      cmsKey: "bespoke_video",
      href: bespoke?.cta_href ?? "/bespoke",
      video: bespoke?.media_url ?? "/videos/bespoke-1.mp4",
      eyebrow: bespoke?.subtitle ?? "Made for your moment.",
      title: bespoke?.title ?? "Made for your moment — not the rack",
    },
  ] as const;

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-8 text-center font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
          Beyond ready-to-wear
        </p>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {cards.map((item) => (
            <EditableSection
              key={item.cmsKey}
              cmsKey={item.cmsKey}
              label={item.cmsKey}
              className="block"
            >
              <Link
                href={item.href}
                className="group relative block aspect-[9/14] overflow-hidden sm:aspect-[4/5]"
              >
                <AutoplayVideo
                  src={item.video}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white sm:p-8">
                  <p className="font-display text-[10px] tracking-[0.3em] text-white/60 uppercase">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {item.title}
                  </h3>
                  <span className="mt-4 inline-flex w-fit items-center gap-2 border border-white/25 px-5 py-2.5 font-display text-[10px] tracking-[0.2em] uppercase transition-colors group-hover:bg-white group-hover:text-mkos-ink">
                    Explore
                    <svg
                      className="h-3 w-3 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </EditableSection>
          ))}
        </div>
      </div>
    </section>
  );
}
