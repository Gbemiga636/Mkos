"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { cn } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

const GLAM_SERVICES = ["Hair", "Makeup", "Gele", "Outfit"] as const;

const CONSENT_OPTIONS = [
  { value: "yes", label: "Yes — I’m in" },
  { value: "discuss", label: "Let’s discuss at the studio" },
  { value: "no", label: "Not this time" },
] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block font-display text-[11px] tracking-[0.22em] text-mkos-muted uppercase">
      {children}
    </label>
  );
}

function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none transition-colors placeholder:text-mkos-muted/60 focus:border-mkos-ink",
        className
      )}
      {...props}
    />
  );
}

function TextSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none focus:border-mkos-ink"
      {...props}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-[100px] w-full resize-y border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none placeholder:text-mkos-muted/60 focus:border-mkos-ink"
      {...props}
    />
  );
}

function ChoiceGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3" role="group">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            name={name}
            onClick={() => onChange(opt.value)}
            className={cn(
              "border px-4 py-3 text-left text-sm transition-colors",
              active
                ? "border-mkos-ink bg-mkos-ink text-white"
                : "border-mkos-border bg-transparent text-mkos-ink hover:border-mkos-ink/50"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ExperiencePageClient() {
  const [contentStatus, setContentStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [glamStatus, setGlamStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [contentMsg, setContentMsg] = useState("");
  const [glamMsg, setGlamMsg] = useState("");

  const [filmed, setFilmed] = useState("");
  const [posted, setPosted] = useState("");
  const [services, setServices] = useState<string[]>([]);

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function submitContent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContentStatus("loading");
    setContentMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/experience/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "content",
          fullName: fd.get("fullName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          filmed,
          posted,
          visitWindow: fd.get("visitWindow"),
          contentNotes: fd.get("contentNotes"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setContentStatus("ok");
      setContentMsg("Received. We’ll honour your preferences when you visit the studio.");
      (e.target as HTMLFormElement).reset();
      setFilmed("");
      setPosted("");
    } catch (err) {
      setContentStatus("err");
      setContentMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function submitGlam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlamStatus("loading");
    setGlamMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/experience/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "full_glam",
          fullName: fd.get("fullName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          eventType: fd.get("eventType"),
          eventDate: fd.get("eventDate"),
          services,
          consultation: fd.get("consultation"),
          glamNotes: fd.get("glamNotes"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setGlamStatus("ok");
      setGlamMsg("Request received. The house will email you to book your consultation.");
      (e.target as HTMLFormElement).reset();
      setServices([]);
    } catch (err) {
      setGlamStatus("err");
      setGlamMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="bg-white">
      <section className="relative min-h-[85vh] overflow-hidden bg-mkos-ink text-white">
        <Image
          src="/images/products/puzzle-dress.jpg"
          alt="MKOS Experience"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mkos-ink via-mkos-ink/50 to-mkos-ink/20" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-[1600px] flex-col justify-end px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
          <motion.p
            {...fade}
            className="font-display text-[11px] tracking-[0.4em] text-white/65 uppercase"
          >
            Studio · Oniru
          </motion.p>
          <motion.h1
            {...fade}
            transition={{ delay: 0.06 }}
            className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-8xl"
          >
            MKOS <span className="italic">Experience</span>
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-lg text-base text-white/75 sm:text-lg"
          >
            From studio content with you, to full glam for your event — arrive prepared, leave
            elevated.
          </motion.p>
          <motion.div
            {...fade}
            transition={{ delay: 0.18 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Button href="#content" variant="secondary" cursor="EXPLORE">
              Studio content
            </Button>
            <Button href="#full-glam" variant="outline" className="border-white/40 text-white" cursor="EXPLORE">
              Full Glam
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-mkos-border px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
              Two ways in
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Look forward to the studio.
            </h2>
          </ScrollReveal>
          <ScrollReveal y={20} delay={80}>
            <p className="text-base leading-relaxed text-mkos-muted sm:text-lg">
              Tell us how you’d like to be included in MKOS Experience content — or book a
              consultation for Full Glam. Your answers go straight to the house, so when you
              arrive the vibe is already right.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content consent */}
      <section id="content" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <ScrollReveal y={16}>
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                Content
              </p>
              <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Be part of MKOS Experience
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-mkos-muted sm:text-base">
                Clients come to the studio and we capture the real experience — fittings, moments,
                the house energy you see on Instagram. Most people love it. If you’d rather skip
                the camera, that’s fine too. Share your preference so we can prepare for you.
              </p>
            </ScrollReveal>
            <ScrollReveal y={16} delay={60} className="mt-10 hidden aspect-[4/5] overflow-hidden bg-mkos-warm lg:block">
              <Image
                src="/images/products/rolly-set.jpg"
                alt="Studio experience"
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            </ScrollReveal>
          </div>

          <ScrollReveal y={20} delay={40}>
            <form onSubmit={submitContent} className="space-y-8 border-t border-mkos-border pt-10 lg:border-t-0 lg:pt-0">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>Full name</FieldLabel>
                  <TextInput name="fullName" required placeholder="Your name" autoComplete="name" />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <TextInput name="email" type="email" required placeholder="you@email.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <FieldLabel>Phone / WhatsApp</FieldLabel>
                <TextInput name="phone" type="tel" placeholder="081…" autoComplete="tel" />
              </div>
              <div>
                <FieldLabel>Comfortable being filmed at the studio?</FieldLabel>
                <ChoiceGroup name="filmed" value={filmed} onChange={setFilmed} options={CONSENT_OPTIONS} />
              </div>
              <div>
                <FieldLabel>Comfortable being posted on our channels?</FieldLabel>
                <ChoiceGroup name="posted" value={posted} onChange={setPosted} options={CONSENT_OPTIONS} />
              </div>
              <div>
                <FieldLabel>When might you visit?</FieldLabel>
                <TextInput name="visitWindow" placeholder="e.g. Weekends, mid-morning, after work…" />
              </div>
              <div>
                <FieldLabel>Anything else we should know?</FieldLabel>
                <TextArea name="contentNotes" placeholder="Schedule, mood, privacy notes…" />
              </div>
              {contentMsg && (
                <p
                  className={cn(
                    "text-sm",
                    contentStatus === "ok" ? "text-mkos-ink" : "text-red-700"
                  )}
                >
                  {contentMsg}
                </p>
              )}
              <Button
                type="submit"
                disabled={contentStatus === "loading" || !filmed || !posted}
                cursor="EXPLORE"
              >
                {contentStatus === "loading" ? "Sending…" : "Share my preference"}
              </Button>
            </form>
          </ScrollReveal>
        </div>
      </section>

      {/* Full Glam */}
      <section
        id="full-glam"
        className="scroll-mt-24 border-t border-mkos-border bg-mkos-warm px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <ScrollReveal y={20}>
            <form onSubmit={submitGlam} className="space-y-8">
              <div>
                <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                  Full Glam
                </p>
                <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                  Event-ready, handled by the house
                </h2>
                <p className="mt-6 max-w-lg text-sm leading-relaxed text-mkos-muted sm:text-base">
                  Hair, makeup, gele, and your outfit — we handle the full look for your event.
                  Request a consultation and we’ll book an appointment to plan every detail with
                  you.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>Full name</FieldLabel>
                  <TextInput name="fullName" required placeholder="Your name" autoComplete="name" />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <TextInput name="email" type="email" required placeholder="you@email.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <FieldLabel>Phone / WhatsApp</FieldLabel>
                <TextInput name="phone" type="tel" placeholder="081…" autoComplete="tel" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>Event type</FieldLabel>
                  <TextInput name="eventType" required placeholder="Wedding, owambe, shoot…" />
                </div>
                <div>
                  <FieldLabel>Event date</FieldLabel>
                  <TextInput name="eventDate" type="date" />
                </div>
              </div>
              <div>
                <FieldLabel>Services you want</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {GLAM_SERVICES.map((s) => {
                    const on = services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={cn(
                          "border px-4 py-2.5 text-sm transition-colors",
                          on
                            ? "border-mkos-ink bg-mkos-ink text-white"
                            : "border-mkos-border bg-white text-mkos-ink hover:border-mkos-ink/40"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <FieldLabel>Consultation preference</FieldLabel>
                <TextSelect name="consultation" defaultValue="in-studio">
                  <option value="in-studio">In-studio (Oniru)</option>
                  <option value="virtual">Virtual</option>
                  <option value="either">Either works</option>
                </TextSelect>
              </div>
              <div>
                <FieldLabel>Brief / notes</FieldLabel>
                <TextArea name="glamNotes" placeholder="Theme, colours, guests, timing…" />
              </div>
              {glamMsg && (
                <p className={cn("text-sm", glamStatus === "ok" ? "text-mkos-ink" : "text-red-700")}>
                  {glamMsg}
                </p>
              )}
              <Button
                type="submit"
                disabled={glamStatus === "loading" || services.length === 0}
                cursor="EXPLORE"
              >
                {glamStatus === "loading" ? "Sending…" : "Request consultation"}
              </Button>
            </form>
          </ScrollReveal>

          <ScrollReveal y={20} delay={60} className="lg:sticky lg:top-28">
            <div className="relative aspect-[3/4] overflow-hidden bg-mkos-ink">
              <Image
                src="/images/products/abeni-boubou.jpg"
                alt="Full Glam"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mkos-ink/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                <p className="font-display text-[11px] tracking-[0.28em] text-white/60 uppercase">
                  Includes
                </p>
                <ul className="mt-4 space-y-2 font-display text-lg">
                  {GLAM_SERVICES.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-white/70">
                  Prefer WhatsApp?{" "}
                  <Link
                    href="https://wa.me/2348143173661"
                    className="underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Message the studio
                  </Link>
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
