"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { ContactBox, EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { useContent } from "@/lib/cms/CmsProvider";
import {
  BRAND_EXPERIENCE,
  BRAND_MISSION,
  BRAND_PHILOSOPHY_BODY,
  BRAND_PHILOSOPHY_TITLE,
  BRAND_PROMISE,
  BRAND_VISION,
  MASTER_INTRO,
  MASTER_PILLARS,
  MKoS_PILLARS,
} from "@/lib/brand";

const IG_MAIN = "https://www.instagram.com/shopmykindofstyle";
const IG_MEN = "https://www.instagram.com/mkosformen";
const WHATSAPP = "https://wa.me/2348143173661";
const WHATSAPP_2 = "https://wa.me/2348104643052";
const EMAIL = "mailto:mkosfashionhouse@gmail.com";

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function AboutPageClient() {
  const section = useContent("brand_story");
  const rawBody = section?.body ?? "";
  const body = /MASTER|Mastery/i.test(rawBody)
    ? rawBody
    : [
        "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.",
        "More than a fashion label, MKoS is a lifestyle brand that seamlessly blends contemporary design with African heritage — elegant, sophisticated, and distinctive.",
        "The MKoS MASTER Standard defines our core values: MKoS defines who we are; MASTER defines how we work.",
      ].join("\n\n");
  const paragraphs = body.split("\n\n").filter(Boolean);
  // Brand Foundation copy is hard-coded — never driven by CMS.
  const mission = BRAND_MISSION;
  const vision = BRAND_VISION;
  const promise = BRAND_PROMISE;
  const masterIntro = MASTER_INTRO;
  const philosophyTitle = BRAND_PHILOSOPHY_TITLE;
  const philosophyBody = BRAND_PHILOSOPHY_BODY;
  const experienceCopy = BRAND_EXPERIENCE;
  const mkosPillars = [...MKoS_PILLARS];
  const masterPillars = [...MASTER_PILLARS];

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative min-h-[70vh] overflow-hidden bg-mkos-ink text-white">
        <Image
          src={section?.media_url ?? "/images/products/abeni-boubou.jpg"}
          alt="MKoS"
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mkos-ink via-mkos-ink/55 to-mkos-ink/25" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-[1600px] flex-col justify-end px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
          <motion.p
            {...fade}
            className="font-display text-[11px] tracking-[0.4em] text-white/65 uppercase"
          >
            Our Brand Promise
          </motion.p>
          <motion.h1
            {...fade}
            transition={{ delay: 0.05 }}
            className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-8xl"
          >
            {promise.includes("STYLE") ? (
              <>
                For Those Who Understand <span className="italic">STYLE</span>.
              </>
            ) : (
              promise
            )}
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
          >
            My Kind of Style — Nigerian contemporary fashion with cultural authenticity.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div {...fade} className="relative aspect-[4/5] overflow-hidden bg-mkos-warm lg:sticky lg:top-28">
            <Image
              src={
                (section?.extra?.secondary_image as string | undefined) ||
                "/images/products/rolly-set.jpg"
              }
              alt="MKoS craftsmanship"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </motion.div>
          <div>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Who we are
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight sm:text-5xl">
              {section?.title ?? "My Kind of Style."}
            </h2>
            {paragraphs.map((p) => (
              <p
                key={p.slice(0, 28)}
                className="mt-5 max-w-2xl text-base leading-relaxed text-mkos-muted sm:text-lg"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="border-y border-mkos-border bg-mkos-warm px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1600px] gap-12 md:grid-cols-2 md:gap-20">
          <ScrollReveal y={32}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
              Mission
            </p>
            <p className="mt-5 font-display text-xl leading-snug tracking-tight sm:text-2xl lg:text-[1.65rem]">
              {mission}
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={80}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
              Vision
            </p>
            <p className="mt-5 font-display text-xl leading-snug tracking-tight sm:text-2xl lg:text-[1.65rem]">
              {vision}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Our Philosophy
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={50}>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium tracking-tight sm:text-5xl">
              {philosophyTitle}
            </h2>
          </ScrollReveal>
          <ScrollReveal y={24} delay={90}>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-mkos-muted sm:text-lg">
              {philosophyBody}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* MASTER Standard intro */}
      <section className="border-t border-mkos-border px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Our Core Values
            </p>
          </ScrollReveal>
          <ScrollReveal y={36} delay={60}>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
              The MKoS MASTER Standard
            </h2>
          </ScrollReveal>
          <ScrollReveal y={28} delay={100}>
            <p className="mt-8 max-w-3xl text-base leading-relaxed text-mkos-muted sm:text-lg">
              {masterIntro}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* MKoS pillars */}
      <section className="border-t border-mkos-border bg-mkos-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={20}>
            <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
              <BrandText>MKoS</BrandText>
              <span className="text-white/90"> Defines who we are.</span>
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {mkosPillars.map((v, i) => (
              <ScrollReveal key={v.title} y={32} delay={i * 70}>
                <div className="border-t border-white/15 pt-6">
                  <p className="font-display text-sm tracking-[0.28em] text-orange-300/90 uppercase">
                    {v.letter} — {v.title}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">{v.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* MASTER pillars */}
      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={20}>
            <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
              MASTER
              <span className="text-mkos-ink/90"> Defines how we work.</span>
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {masterPillars.map((v, i) => (
              <ScrollReveal key={v.title} y={32} delay={i * 50}>
                <div>
                  <span className="font-display text-sm text-mkos-accent">
                    {v.letter} — {v.title}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-mkos-muted sm:text-[0.95rem]">
                    {v.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* The MKoS Experience */}
      <section className="border-t border-mkos-border bg-mkos-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1600px]">
          <ScrollReveal y={24}>
            <p className="font-display text-[11px] tracking-[0.35em] text-orange-300/90 uppercase">
              The MKoS Experience
            </p>
          </ScrollReveal>
          <ScrollReveal y={32} delay={60}>
            <p className="mt-6 max-w-3xl font-display text-2xl leading-snug tracking-tight sm:text-3xl lg:text-4xl">
              Luxury is more than what you wear—it’s how you feel.
            </p>
          </ScrollReveal>
          <ScrollReveal y={24} delay={100}>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
              {experienceCopy.replace(/^Luxury is more than what you wear—it’s how you feel\.\s*/i, "")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact + email */}
      <section id="contact" className="border-t border-mkos-border bg-mkos-warm px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1600px]">
          <div className="max-w-2xl">
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Contact
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-5xl">
              Reach the studio.
            </h2>
            <p className="mt-4 text-mkos-muted">
              Visit us in Oniru, message on WhatsApp, or write to the house — we’re here for
              Ready-to-Wear, custom, bridal, and MKoS Men enquiries.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ContactBox
              label="Email"
              value="mkosfashionhouse@gmail.com"
              href={EMAIL}
              hint="Orders, fittings & collaborations"
            />
            <ContactBox
              label="WhatsApp"
              value="08143173661"
              href={WHATSAPP}
              hint="Primary line · quick replies"
            />
            <ContactBox
              label="WhatsApp"
              value="08104643052"
              href={WHATSAPP_2}
              hint="Secondary line"
            />
            <ContactBox
              label="Instagram"
              value="@shopmykindofstyle"
              href={IG_MAIN}
              hint="MKoS main page"
            />
            <ContactBox
              label="Instagram · Men"
              value="@mkosformen"
              href={IG_MEN}
              hint="MKoS Men"
            />
            <ContactBox
              label="Studio"
              value="Oniru, Lagos"
              href="https://maps.google.com/?q=1+Ade+Adedeji+close+Ayo+Babatunde+Crescent+Oniru+Lagos"
              hint="1, Ade Adedeji Close, Ayo Babatunde Crescent"
            />
          </div>

          <div className="mt-16 grid gap-10 border border-mkos-border bg-[linear-gradient(145deg,#fafafa_0%,#ffffff_45%,#fff7f2_100%)] p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
                Private list
              </p>
              <h3 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                Stay close to the next chapter.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-mkos-muted">
                Studio drops, fittings, and new collections — straight from Oniru to your inbox.
              </p>
            </div>
            <EmailSubscribe buttonLabel="Join the list" source="about" />
          </div>

          <div className="mt-14 flex flex-wrap gap-4">
            <Button href="/shop" size="lg">
              Shop the collection
            </Button>
            <Button href="/shop?collection=ready-to-wear&category=men-rtw" variant="secondary" size="lg">
              MKoS Men
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
