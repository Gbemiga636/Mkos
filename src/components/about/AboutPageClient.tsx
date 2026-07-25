"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ContactBox, EmailSubscribe } from "@/components/ui/EmailSubscribe";
import { useContent } from "@/lib/cms/CmsProvider";

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
  const paragraphs = (section?.body ?? "").split("\n\n").filter(Boolean);
  const values =
    (section?.extra?.values as { title: string; text: string }[] | undefined) ??
    [
      {
        title: "Quality",
        text: "Every piece is made with care, precision, and attention to detail because at MKOS, quality is never an afterthought.",
      },
      {
        title: "Elegance",
        text: "We believe true style is timeless. Our designs are created to remain stylish beyond seasonal trends.",
      },
      {
        title: "Individuality",
        text: "Everyone is different, and so is their style. We celebrate self-expression. We are everyone’s Kind Of Style.",
      },
      {
        title: "Customer Experience",
        text: "From your first interaction to the moment you wear your MKOS piece, every experience should be memorable.",
      },
    ];

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative min-h-[70vh] overflow-hidden bg-mkos-ink text-white">
        <Image
          src={section?.media_url ?? "/images/products/abeni-boubou.jpg"}
          alt="MKOS"
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mkos-ink via-mkos-ink/55 to-mkos-ink/25" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-[1600px] flex-col justify-end px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-24">
          <motion.p
            {...fade}
            className="font-display text-[11px] tracking-[0.4em] text-white/65 uppercase"
          >
            About MKOS
          </motion.p>
          <motion.h1
            {...fade}
            transition={{ delay: 0.05 }}
            className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-8xl"
          >
            My Kind of Style.
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
          >
            For Those Who Understand STYLE.
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
              alt="MKOS craftsmanship"
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
              Nigerian contemporary fashion with cultural authenticity.
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
          <motion.div {...fade}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
              Our Mission
            </p>
            <p className="mt-5 font-display text-2xl leading-snug tracking-tight sm:text-3xl">
              Create elegant, high-quality fashion that empowers everyone to express their
              individuality through timeless style, exceptional craftsmanship, and confidence.
            </p>
          </motion.div>
          <motion.div {...fade} transition={{ delay: 0.08 }}>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-accent uppercase">
              Our Vision
            </p>
            <p className="mt-5 font-display text-2xl leading-snug tracking-tight sm:text-3xl">
              Become a leading, trusted sophisticated fashion brand recognized for excellence,
              creativity, and designs that empower men and women with everyday elegance and
              authenticity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1600px]">
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
            Our Values
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-5xl">
            What we stand for.
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div key={v.title} {...fade} transition={{ delay: i * 0.06 }}>
                <span className="font-display text-sm text-mkos-accent">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl tracking-tight">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mkos-muted">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Difference + audience */}
      <section className="bg-mkos-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-16 lg:grid-cols-2">
          <div>
            <p className="font-display text-[11px] tracking-[0.35em] text-white/50 uppercase">
              What makes MKOS different
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Style should be personal.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
              Our name, My Kind of Style, reflects our philosophy that fashion isn’t about fitting
              into someone else’s idea of style — it’s about embracing your own. Every collection
              is designed to inspire confidence, celebrate individuality, and help you express
              yourself authentically.
            </p>
          </div>
          <div>
            <p className="font-display text-[11px] tracking-[0.35em] text-white/50 uppercase">
              Who we dress
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Quality over quantity.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
              Professionals, entrepreneurs, executives, brides, wedding guests, celebrants, and
              style-conscious individuals who seek exclusivity rather than mass-produced fashion —
              whether bold, classic, or effortlessly understated.
            </p>
          </div>
        </div>
      </section>

      {/* Contact + email */}
      <section id="contact" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
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
              hint="MKOS main page"
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
            <EmailSubscribe buttonLabel="Join the list" />
          </div>

          <div className="mt-14 flex flex-wrap gap-4">
            <Button href="/shop" size="lg">
              Shop the collection
            </Button>
            <Button href="/shop?collection=men" variant="secondary" size="lg">
              MKoS Men
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
