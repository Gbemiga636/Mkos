"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandText } from "@/components/ui/BrandText";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { EditableSection } from "@/components/cms/EditableSection";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/cms/CmsProvider";

const STEPS = [
  { id: "you", label: "You", title: "Who we’re dressing" },
  { id: "moment", label: "Moment", title: "The defining moment" },
  { id: "piece", label: "Piece", title: "The piece & atelier services" },
  { id: "finish", label: "Finish", title: "Fit, delivery & send" },
] as const;

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

/** Full Glam services without Hair */
const ATELIER_SERVICES = ["Makeup", "Gele", "Outfit"] as const;

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

const CONSULTATION = [
  { value: "in-studio", label: "In-studio consultation" },
  { value: "virtual", label: "Virtual consultation" },
  { value: "either", label: "Either works" },
] as const;

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-4 py-2.5 text-left font-display text-[11px] tracking-[0.14em] uppercase transition-colors",
        active
          ? "border-mkos-ink bg-mkos-ink text-white"
          : "border-mkos-border bg-white text-mkos-ink hover:border-mkos-ink/40"
      )}
    >
      {children}
    </button>
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
      className="min-h-[100px] w-full resize-y border-0 border-b border-mkos-border bg-transparent py-3 text-sm text-mkos-ink outline-none placeholder:text-mkos-muted/50 focus:border-mkos-ink"
      {...props}
    />
  );
}

export function BespokePageClient() {
  const bespoke = useContent("bespoke_video");

  const [step, setStep] = useState(0);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [outfitTypes, setOutfitTypes] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [measurementsOption, setMeasurementsOption] = useState("");
  const [contentPermission, setContentPermission] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [consultation, setConsultation] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      return;
    }

    setStatus("loading");
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("eventTypes", JSON.stringify(eventTypes));
    fd.set("outfitTypes", JSON.stringify(outfitTypes));
    fd.set("services", JSON.stringify(services));
    fd.set("measurementsOption", measurementsOption);
    fd.set("contentPermission", contentPermission);
    fd.set("deliveryMethod", deliveryMethod);
    fd.set("consultation", consultation);
    if (files) {
      Array.from(files)
        .slice(0, 5)
        .forEach((f) => fd.append("inspirationPhotos", f));
    }

    try {
      const res = await fetch("/api/bespoke", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("ok");
      setMessage("Your Bespoke brief is with the house. We’ll be in touch soon.");
      form.reset();
      setEventTypes([]);
      setOutfitTypes([]);
      setServices([]);
      setMeasurementsOption("");
      setContentPermission("");
      setDeliveryMethod("");
      setConsultation("");
      setFiles(null);
      setStep(0);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not send your brief");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <EditableSection cmsKey="bespoke_video" label="Bespoke video" className="block">
        <section className="relative flex min-h-[72svh] flex-col justify-end overflow-hidden bg-mkos-ink text-white">
          <div className="absolute inset-0">
            <AutoplayVideo
              src={bespoke?.media_url ?? "/videos/bespoke-1.mp4"}
              whenVisible={false}
              eager
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-20">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[11px] tracking-[0.4em] text-white/60 uppercase"
            >
              {bespoke?.eyebrow ?? "Bespoke / Custom Wear"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-7xl"
            >
              {bespoke?.title ?? "Made for your moment — not the rack"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
            >
              {bespoke?.body ?? bespoke?.subtitle ?? "Begin your atelier brief. Share the occasion, the silhouette, and the services you want. The house crafts from there."}
            </motion.p>
          </div>
        </section>
      </EditableSection>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:py-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <ScrollReveal y={20}>
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Atelier journey
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              {STEPS[step].title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mkos-muted">
              Four quiet steps. One precise brief. Your answers land in the studio inbox — with any
              inspiration photos attached.
            </p>
          </ScrollReveal>

          <div className="mt-8 h-px w-full overflow-hidden bg-mkos-border">
            <motion.div
              className="h-full bg-mkos-ink"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ol className="mt-8 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-baseline gap-4 text-left transition-colors",
                    i === step ? "text-mkos-ink" : "text-mkos-muted hover:text-mkos-ink"
                  )}
                >
                  <span className="font-display text-[10px] tracking-[0.22em] uppercase">
                    0{i + 1}
                  </span>
                  <span className="font-display text-lg tracking-tight">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-xs leading-relaxed text-mkos-muted">
            Prefer Ready-to-Wear?{" "}
            <Link href="/shop?collection=ready-to-wear" className="underline underline-offset-2">
              Shop the collection
            </Link>
            . Bridal is coming soon.
          </p>
        </aside>

        <form onSubmit={onSubmit} className="border border-mkos-border bg-white p-6 sm:p-10">
          <div className={step === 0 ? "space-y-6" : "hidden"}>
            <div>
              <FieldLabel>Full name</FieldLabel>
              <TextInput name="fullName" required={step === 0} autoComplete="name" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput name="phone" type="tel" required={step === 0} autoComplete="tel" />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput name="email" type="email" required={step === 0} autoComplete="email" />
              </div>
            </div>
            <div>
              <FieldLabel>Instagram (optional)</FieldLabel>
              <TextInput name="instagram" placeholder="@yourhandle" />
            </div>
          </div>

          <div className={step === 1 ? "space-y-8" : "hidden"}>
            <div>
              <FieldLabel>Type of event</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {EVENT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    active={eventTypes.includes(t)}
                    onClick={() => setEventTypes((s) => toggle(s, t))}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="mt-4">
                <FieldLabel>Other</FieldLabel>
                <TextInput name="eventOther" placeholder="If other, please specify" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Event date</FieldLabel>
                <TextInput name="eventDate" type="date" />
              </div>
              <div>
                <FieldLabel>Outfit needed by</FieldLabel>
                <TextInput name="outfitNeededBy" type="date" />
              </div>
            </div>
          </div>

          <div className={step === 2 ? "space-y-8" : "hidden"}>
            <div>
              <FieldLabel>What should we create?</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {OUTFIT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    active={outfitTypes.includes(t)}
                    onClick={() => setOutfitTypes((s) => toggle(s, t))}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="mt-4">
                <FieldLabel>Other</FieldLabel>
                <TextInput name="outfitOther" placeholder="If other, please specify" />
              </div>
            </div>

            <div>
              <FieldLabel>Atelier services</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-3">
                {ATELIER_SERVICES.map((s) => {
                  const on = services.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setServices((list) => toggle(list, s))}
                      className={cn(
                        "relative overflow-hidden border px-4 py-8 text-center transition-all",
                        on
                          ? "border-mkos-ink bg-mkos-ink text-white"
                          : "border-mkos-border bg-[#f7f4ef] hover:border-mkos-ink/35"
                      )}
                    >
                      <span className="font-display text-lg tracking-tight">{s}</span>
                      <span
                        className={cn(
                          "mt-2 block font-display text-[10px] tracking-[0.2em] uppercase",
                          on ? "text-white/60" : "text-mkos-muted"
                        )}
                      >
                        {on ? "Selected" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Consultation preference</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {CONSULTATION.map((c) => (
                  <Chip
                    key={c.value}
                    active={consultation === c.value}
                    onClick={() => setConsultation(c.value)}
                  >
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Preferred style / inspiration</FieldLabel>
              <TextArea name="preferredStyle" placeholder="Silhouette, mood, references…" />
            </div>
            <div>
              <FieldLabel>Inspiration photos (optional)</FieldLabel>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="mt-2 block w-full text-sm text-mkos-muted file:mr-4 file:border-0 file:bg-mkos-ink file:px-4 file:py-2 file:font-display file:text-[10px] file:tracking-[0.16em] file:text-white file:uppercase"
              />
              <p className="mt-2 text-xs text-mkos-muted">Up to 5 images · 2.5MB each</p>
              <div className="mt-3">
                <FieldLabel>Note on photos</FieldLabel>
                <TextInput name="inspirationNote" placeholder="Any notes about the references" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Preferred fabric</FieldLabel>
                <TextInput name="preferredFabric" />
              </div>
              <div>
                <FieldLabel>Preferred color(s)</FieldLabel>
                <TextInput name="preferredColors" />
              </div>
            </div>
            <div>
              <FieldLabel>Colors to avoid</FieldLabel>
              <TextInput name="avoidColors" />
            </div>
            <div>
              <FieldLabel>Styling notes (gele / makeup / look)</FieldLabel>
              <TextArea name="glamNotes" placeholder="Anything the studio should know…" />
            </div>
          </div>

          <div className={step === 3 ? "space-y-8" : "hidden"}>
            <div>
              <FieldLabel>Measurements</FieldLabel>
              <div className="mt-3 space-y-2">
                {MEASUREMENT_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm transition-colors",
                      measurementsOption === o.value
                        ? "border-mkos-ink bg-mkos-warm/50"
                        : "border-mkos-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="measurementsRadio"
                      className="mt-1 accent-mkos-ink"
                      checked={measurementsOption === o.value}
                      onChange={() => setMeasurementsOption(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <FieldLabel>Past order / measurement notes</FieldLabel>
                <TextArea name="pastOrderNotes" />
              </div>
            </div>

            <div>
              <FieldLabel>Budget</FieldLabel>
              <TextInput name="budget" placeholder="e.g. ₦250,000 – ₦400,000" />
            </div>

            <div>
              <FieldLabel>
                <BrandText>MKoS Experience content</BrandText>
              </FieldLabel>
              <p className="mb-3 text-xs text-mkos-muted">
                May we feature your photos/videos and/or testimonials?
              </p>
              <div className="space-y-2">
                {CONTENT_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm",
                      contentPermission === o.value
                        ? "border-mkos-ink bg-mkos-warm/50"
                        : "border-mkos-border"
                    )}
                  >
                    <input
                      type="radio"
                      className="mt-1 accent-mkos-ink"
                      checked={contentPermission === o.value}
                      onChange={() => setContentPermission(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Delivery</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {DELIVERY_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={deliveryMethod === o.value}
                    onClick={() => setDeliveryMethod(o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
              <div className="mt-4">
                <FieldLabel>Delivery address (if needed)</FieldLabel>
                <TextArea name="deliveryAddress" />
              </div>
            </div>

            <div>
              <FieldLabel>Anything else?</FieldLabel>
              <TextArea name="additionalRequests" />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-mkos-border pt-8">
            {step > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
            )}
            <Button type="submit" size="lg" disabled={status === "loading"} cursor="EXPLORE">
              {status === "loading"
                ? "Sending…"
                : step < STEPS.length - 1
                  ? "Continue"
                  : "Send to the house"}
            </Button>
            {message && (
              <p
                className={cn(
                  "w-full text-sm",
                  status === "ok" ? "text-mkos-accent" : "text-red-600"
                )}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
