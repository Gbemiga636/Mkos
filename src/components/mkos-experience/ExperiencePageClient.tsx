"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { EditableSection } from "@/components/cms/EditableSection";
import { FramedFilm } from "@/components/ui/FramedFilm";
import { useContent } from "@/lib/cms/CmsProvider";

const WHATSAPP = "https://wa.me/2348143173661";
const WHATSAPP_2 = "https://wa.me/2348104643052";
const MAPS =
  "https://maps.google.com/?q=1,+Ade+Adedeji+Close,+Ayo+Babatunde+Crescent,+Oniru,+Lagos";
const STUDIO = "1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos";

const MOMENTS = [
  {
    title: "The fitting",
    text: "Quiet rooms, precise hands, and the real rhythm of the house — captured as it happens.",
  },
  {
    title: "The finish",
    text: "Full glam energy when you’re ready for an event: presence, polish, and the look that walks with you.",
  },
  {
    title: "The story",
    text: "Moments that feel like you — shared only when the vibe is right, always with respect.",
  },
] as const;

export function ExperiencePageClient() {
  const experience = useContent("experience_video");

  return (
    <div className="bg-white">
      <EditableSection cmsKey="experience_video" label="Experience video" className="block">
        <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-mkos-ink text-white">
          <div className="absolute inset-0">
            <AutoplayVideo
              src={experience?.media_url ?? "/videos/experience-1.mp4"}
              whenVisible={false}
              eager
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[11px] tracking-[0.4em] text-white/55 uppercase"
            >
              {experience?.eyebrow ?? "Studio · Oniru"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-8xl"
            >
              <BrandText>MKoS</BrandText>{" "}
              <span className="italic">{experience?.title ?? "Experience with you"}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
            >
              {experience?.body ?? experience?.subtitle ?? "Luxury is more than what you wear-it's how you feel."}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center border border-white/20 bg-white px-9 font-display text-xs tracking-[0.14em] !text-mkos-ink uppercase"
              >
                Plan your visit on WhatsApp
              </Link>
              <Button
                href="#studio"
                variant="outline"
                size="lg"
                className="border-white/40 text-white"
                cursor="EXPLORE"
              >
                Studio details
              </Button>
            </motion.div>
          </div>
        </section>
      </EditableSection>

      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
              In the house
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
              Come through. We’ll take it from there.
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {MOMENTS.map((m, i) => (
              <ScrollReveal key={m.title} y={28} delay={i * 80}>
                <div className="border-t border-mkos-border pt-6">
                  <p className="font-display text-[10px] tracking-[0.28em] text-mkos-accent uppercase">
                    0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-medium tracking-tight">{m.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-mkos-muted sm:text-base">{m.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ef] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={20} className="mx-auto max-w-xl text-center">
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
              The film
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Feel the Experience.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mkos-muted sm:text-base">
              Press play — sound on. A quiet look inside the house.
            </p>
          </ScrollReveal>
          <ScrollReveal y={36} delay={80} className="mt-12 flex justify-center sm:mt-16">
            <FramedFilm src="/videos/experience-3.mp4" aspect="portrait" />
          </ScrollReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-mkos-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src="/images/products/tammy-dress.jpg"
            alt=""
            fill
            className="object-cover opacity-40"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-mkos-ink via-mkos-ink/70 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.28em] text-white/45 uppercase">
              An open invitation
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Stop by the studio.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              Whether you’re dressing for a defining moment, joining studio content, or simply want
              to feel the house in person — you’re welcome in Oniru. Message us, then walk through
              the door.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center border border-white/20 bg-white px-9 font-display text-xs tracking-[0.14em] !text-mkos-ink uppercase"
              >
                WhatsApp the house
              </Link>
              <Button
                href={MAPS}
                variant="outline"
                size="lg"
                className="border-white/35 text-white"
              >
                Get directions
              </Button>
            </div>
          </ScrollReveal>
          <div className="relative aspect-[4/5] overflow-hidden bg-white/5 lg:hidden">
            <Image
              src="/images/products/tammy-dress.jpg"
              alt=""
              fill
              className="object-cover opacity-70"
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      <section id="studio" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Find us
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              The atelier is waiting.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-mkos-muted sm:text-lg">{STUDIO}</p>
            <div className="mt-8 space-y-3 text-sm">
              <p>
                <a
                  href={WHATSAPP}
                  className="!text-mkos-ink underline underline-offset-4 hover:text-mkos-ink"
                >
                  WhatsApp · 0814 317 3661
                </a>
              </p>
              <p>
                <a
                  href={WHATSAPP_2}
                  className="!text-mkos-ink underline underline-offset-4 hover:text-mkos-ink"
                >
                  WhatsApp · 0810 464 3052
                </a>
              </p>
              <p>
                <a
                  href="mailto:mkosfashionhouse@gmail.com"
                  className="!text-mkos-ink underline underline-offset-4 hover:text-mkos-ink"
                >
                  mkosfashionhouse@gmail.com
                </a>
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href={MAPS} size="lg">
                Open in Maps
              </Button>
              <Button href="/bespoke" variant="secondary" size="lg">
                Bespoke / Custom Wear
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal y={28} delay={60}>
            <div className="relative aspect-[5/4] overflow-hidden bg-mkos-warm">
              <Image
                src="/images/products/abeni-boubou.jpg"
                alt="MKoS studio atmosphere"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <p className="mt-4 font-display text-[11px] tracking-[0.22em] text-mkos-muted uppercase">
              For Those Who Understand STYLE
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-mkos-border bg-[#f7f4ef] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
              Ready when you are
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Visit the studio. Live the Experience.
            </h2>
          </div>
          <Link
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center bg-mkos-ink px-8 font-display text-[11px] tracking-[0.2em] text-white uppercase"
          >
            WhatsApp · Message us to stop by
          </Link>
        </div>
      </section>
    </div>
  );
}
