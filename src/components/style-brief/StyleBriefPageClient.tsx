"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Corporate",
  "Photoshoot",
  "Vacation",
] as const;

const OUTFIT_TYPES = [
  "Dress",
  "Boubou",
  "Two-Piece Set",
  "Skirt & Blouse",
  "Pants Set",
  "Men’s Native Wear",
] as const;

const MEASUREMENT_OPTIONS = [
  { value: "attached", label: "My measurements are attached." },
  { value: "showroom", label: "I will visit the showroom for measurements." },
  { value: "virtual", label: "I would like virtual measurement guidance." },
] as const;

const CONTENT_OPTIONS = [
  { value: "yes", label: "Yes, I give permission" },
  { value: "no", label: "No, I prefer not to be featured" },
] as const;

const DELIVERY_OPTIONS = [
  { value: "pickup", label: "Pick Up" },
  { value: "local", label: "Local Delivery" },
  { value: "international", label: "International Shipping" },
] as const;

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-8 border-b border-mkos-border pb-4">
      <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">{n}</p>
      <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block font-display text-[11px] tracking-[0.2em] text-mkos-muted uppercase">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none transition-colors placeholder:text-mkos-muted/50 focus:border-mkos-ink"
      {...props}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-[110px] w-full resize-y border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none placeholder:text-mkos-muted/50 focus:border-mkos-ink"
      {...props}
    />
  );
}

function CheckGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "border px-4 py-3 text-left text-sm transition-colors",
              on
                ? "border-mkos-ink bg-mkos-ink text-white"
                : "border-mkos-border text-mkos-ink hover:border-mkos-ink/40"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioList({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex w-full border px-4 py-3 text-left text-sm transition-colors",
              on
                ? "border-mkos-ink bg-mkos-ink text-white"
                : "border-mkos-border text-mkos-ink hover:border-mkos-ink/40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function StyleBriefPageClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [outfitTypes, setOutfitTypes] = useState<string[]>([]);
  const [measurementsOption, setMeasurementsOption] = useState("");
  const [contentPermission, setContentPermission] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    const fd = new FormData(e.currentTarget);
    fd.set("eventTypes", JSON.stringify(eventTypes));
    fd.set("outfitTypes", JSON.stringify(outfitTypes));
    fd.set("measurementsOption", measurementsOption);
    fd.set("contentPermission", contentPermission);
    fd.set("deliveryMethod", deliveryMethod);
    if (files) {
      Array.from(files).slice(0, 5).forEach((file) => fd.append("inspirationPhotos", file));
    }

    try {
      const res = await fetch("/api/style-brief", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setStatus("ok");
      setMsg("Thank you — your Client Style Brief is with the house. We’ll be in touch.");
      (e.target as HTMLFormElement).reset();
      setEventTypes([]);
      setOutfitTypes([]);
      setMeasurementsOption("");
      setContentPermission("");
      setDeliveryMethod("");
      setFiles(null);
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-mkos-ink px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,92,38,0.25),transparent_55%)]" />
        <div className="relative mx-auto max-w-[900px]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[11px] tracking-[0.4em] text-white/60 uppercase"
          >
            Client Style Brief
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-7xl"
          >
            Thank you for choosing <span className="italic">MKoS</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
          >
            Please take a few moments to complete this form. This helps us understand your style,
            preferences, and requirements so we can create a piece that reflects you beautifully.
          </motion.p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <ScrollReveal y={20}>
          <SectionTitle n="01" title="Personal information" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Full name</FieldLabel>
              <TextInput name="fullName" required autoComplete="name" />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <TextInput name="phone" type="tel" required autoComplete="tel" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput name="email" type="email" required autoComplete="email" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Instagram handle (optional)</FieldLabel>
              <TextInput name="instagram" placeholder="@yourhandle" />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="02" title="Event details" />
          <FieldLabel>Type of event</FieldLabel>
          <CheckGrid
            options={EVENT_TYPES}
            selected={eventTypes}
            onToggle={(v) => setEventTypes((s) => toggle(s, v))}
          />
          <div className="mt-4">
            <FieldLabel>Other</FieldLabel>
            <TextInput name="eventOther" placeholder="If other, please specify" />
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel>Event date</FieldLabel>
              <TextInput name="eventDate" type="date" />
            </div>
            <div>
              <FieldLabel>Outfit needed by</FieldLabel>
              <TextInput name="outfitNeededBy" type="date" />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="03" title="Your outfit" />
          <FieldLabel>What would you like us to create?</FieldLabel>
          <CheckGrid
            options={OUTFIT_TYPES}
            selected={outfitTypes}
            onToggle={(v) => setOutfitTypes((s) => toggle(s, v))}
          />
          <div className="mt-4">
            <FieldLabel>Other</FieldLabel>
            <TextInput name="outfitOther" placeholder="If other, please specify" />
          </div>
          <div className="mt-8">
            <FieldLabel>Preferred style or inspiration</FieldLabel>
            <TextArea name="preferredStyle" placeholder="Silhouette, mood, references…" />
          </div>
          <div className="mt-6">
            <FieldLabel>Inspiration photos (optional)</FieldLabel>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="mt-2 block w-full text-sm text-mkos-muted file:mr-4 file:border-0 file:bg-mkos-ink file:px-4 file:py-2 file:font-display file:text-[10px] file:tracking-[0.16em] file:text-white file:uppercase"
            />
            <p className="mt-2 text-xs text-mkos-muted">Up to 5 images · 2.5MB each · sent with your brief</p>
            <div className="mt-4">
              <FieldLabel>Or share a note / links</FieldLabel>
              <TextInput name="inspirationNote" placeholder="Pinterest, Instagram links…" />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="04" title="Fabric & color" />
          <div className="space-y-6">
            <div>
              <FieldLabel>Preferred fabric (if any)</FieldLabel>
              <TextInput name="preferredFabric" />
            </div>
            <div>
              <FieldLabel>Preferred color(s)</FieldLabel>
              <TextInput name="preferredColors" />
            </div>
            <div>
              <FieldLabel>Any colors you’d like us to avoid?</FieldLabel>
              <TextInput name="avoidColors" />
            </div>
          </div>
          <p className="mt-12 font-display text-sm tracking-[0.08em] text-mkos-muted uppercase">
            Thank you for letting us be part of your special moment.
          </p>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="05" title="Measurements" />
          <FieldLabel>Please select an option</FieldLabel>
          <RadioList
            options={MEASUREMENT_OPTIONS}
            value={measurementsOption}
            onChange={setMeasurementsOption}
          />
          <div className="mt-8">
            <FieldLabel>
              If you have a past MKoS order, share your order number or measurement notes
            </FieldLabel>
            <TextArea name="pastOrderNotes" />
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="06" title="Budget" />
          <FieldLabel>Your preferred budget range</FieldLabel>
          <TextInput name="budget" placeholder="e.g. ₦250,000 – ₦400,000" />
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="07" title="Additional requests" />
          <FieldLabel>
            Special requests, preferences, or important details
          </FieldLabel>
          <TextArea name="additionalRequests" />

          <div className="mt-14 border-t border-mkos-border pt-12">
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              <BrandText>MKoS Experience content</BrandText>
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mkos-muted">
              We love to celebrate our clients and share your beautiful looks as part of the MKoS
              Experience on our social media and other marketing platforms.
            </p>
            <p className="mt-6 mb-3 font-display text-[11px] tracking-[0.2em] text-mkos-muted uppercase">
              May we feature your photos/videos and/or testimonials?
            </p>
            <RadioList
              options={CONTENT_OPTIONS}
              value={contentPermission}
              onChange={setContentPermission}
            />
            <p className="mt-3 text-xs text-mkos-muted">You can change your mind anytime.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-20">
          <SectionTitle n="08" title="Delivery" />
          <FieldLabel>Preferred delivery method</FieldLabel>
          <RadioList
            options={DELIVERY_OPTIONS}
            value={deliveryMethod}
            onChange={setDeliveryMethod}
          />
          <div className="mt-8">
            <FieldLabel>Delivery address (if applicable)</FieldLabel>
            <TextArea name="deliveryAddress" placeholder="Street, city, country…" />
          </div>
        </ScrollReveal>

        <ScrollReveal y={16} className="mt-16 border-t border-mkos-border pt-12">
          <p className="max-w-2xl text-sm leading-relaxed text-mkos-muted">
            Thank you for choosing MKoS – My Kind Of Style. We look forward to creating something
            exceptional, crafted just for you.
          </p>
          <div className="mt-10 grid gap-8 text-sm text-mkos-muted sm:grid-cols-3">
            <div>
              <p className="font-display text-[10px] tracking-[0.22em] text-mkos-ink uppercase">
                Showroom
              </p>
              <p className="mt-2">Oniru, Victoria Island, Lagos, Nigeria.</p>
            </div>
            <div>
              <p className="font-display text-[10px] tracking-[0.22em] text-mkos-ink uppercase">
                Instagram
              </p>
              <p className="mt-2">
                <a
                  href="https://www.instagram.com/shopmykindofstyle"
                  className="hover:text-mkos-ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @shopmykindofstyle
                </a>
                <br />
                <a
                  href="https://www.instagram.com/mkosformen"
                  className="hover:text-mkos-ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @mkosformen
                </a>
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] tracking-[0.22em] text-mkos-ink uppercase">
                Email
              </p>
              <p className="mt-2">
                <a href="mailto:mkosfashionhouse@gmail.com" className="hover:text-mkos-ink">
                  mkosfashionhouse@gmail.com
                </a>
              </p>
            </div>
          </div>

          {msg && (
            <p className={cn("mt-10 text-sm", status === "ok" ? "text-mkos-ink" : "text-red-700")}>
              {msg}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <Button type="submit" size="lg" disabled={status === "loading"} cursor="EXPLORE">
              {status === "loading" ? "Sending…" : "Submit style brief"}
            </Button>
            <Button href="/experience" variant="ghost" cursor="EXPLORE">
              MKoS Experience
            </Button>
          </div>
          <p className="mt-6 text-xs text-mkos-muted">
            Your brief is emailed straight to the house. Prefer WhatsApp?{" "}
            <Link href="https://wa.me/2348143173661" className="underline underline-offset-2">
              Message us
            </Link>
            .
          </p>
        </ScrollReveal>
      </form>
    </main>
  );
}
