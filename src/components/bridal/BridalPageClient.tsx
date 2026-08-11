"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { EditableSection } from "@/components/cms/EditableSection";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/cms/CmsProvider";

const STEPS = [
  { id: "you", label: "About You" },
  { id: "party", label: "Who are we styling?" },
  { id: "celebration", label: "Celebration" },
  { id: "atelier", label: "Atelier" },
  { id: "finish", label: "Begin" },
] as const;

const COMM = ["WhatsApp", "Phone Call", "Email"] as const;
const STYLING_FOR = [
  "Bride",
  "Groom",
  "Bride & Groom",
  "Bridesmaids",
  "Groomsmen",
  "Parents of the Bride",
  "Parents of the Groom",
  "Other",
] as const;

const STYLING_EXPERIENCE = [
  { group: "Bride", options: ["Traditional Ceremony Attire", "Registry / Civil Wedding Dress", "Reception Outfit"] },
  { group: "Groom", options: ["Traditional Attire"] },
  { group: "Bridesmaids", options: ["Bridesmaids Dresses", "Aso Ebi"] },
  { group: "Groomsmen", options: ["Aso Ebi"] },
  { group: "Parents", options: ["Traditional Attire", "Reception Attire"] },
] as const;

const STAGES = [
  "Just exploring my options",
  "Ready to begin designing",
  "Comparing designers",
  "Looking for urgent production",
] as const;

const CULTURES = [
  "Yoruba",
  "Igbo",
  "Edo",
  "Urhobo",
  "Itsekiri",
  "Hausa / Fulani",
  "Efik / Ibibio",
  "Tiv",
  "Mixed Heritage",
  "Other",
] as const;

const EXTRA_EVENTS = [
  "Bridal Shower",
  "Introduction Ceremony",
  "Welcome Dinner",
  "Traditional Engagement",
  "After Party",
  "Other",
] as const;

const FABRIC_PROVIDERS = [
  "Client will provide all fabrics/materials",
  "MKoS will source and provide all fabrics/materials",
  "Combination of both",
] as const;

const EXPERIENCES = [
  "Garment Design & Production Only",
  "Garment + Gele Coordination",
  "Garment + Accessories Styling",
  "Full MKoS Bridal Styling Experience",
] as const;

const CONSULTATION = [
  "Virtual Consultation",
  "In-Person Consultation (Lagos Atelier)",
  "Pop-Up Appointment (when available)",
] as const;

const FITTINGS = [
  "Yes",
  "Yes, during an upcoming trip to Lagos",
  "No, I will require virtual fittings",
  "I’d like to discuss the best option",
] as const;

const TIMELINES = ["Less than 1 Month", "1–2 Months", "3–6 Months", "More than 6 Months"] as const;

const HEAR = [
  "Instagram",
  "Referral",
  "Wedding Planner",
  "Previous Client",
  "Google",
  "Facebook",
  "TikTok",
  "Pop-Up Event",
  "Other",
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

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-mkos-border pb-3">
      <span className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">{n}</span>
      <h3 className="font-display text-xl tracking-tight text-mkos-ink sm:text-2xl">{title}</h3>
    </div>
  );
}

export function BridalPageClient() {
  const bridal = useContent("bridal_video");

  const [step, setStep] = useState(0);
  const [preferredComm, setPreferredComm] = useState<string[]>([]);
  const [stylingFor, setStylingFor] = useState<string[]>([]);
  const [stylingExperience, setStylingExperience] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [weddingCulture, setWeddingCulture] = useState<string[]>([]);
  const [additionalEvents, setAdditionalEvents] = useState<string[]>([]);
  const [fabricProvider, setFabricProvider] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [consultationStart, setConsultationStart] = useState("");
  const [fittingsOption, setFittingsOption] = useState("");
  const [timeline, setTimeline] = useState("");
  const [hearAbout, setHearAbout] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
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

    const payload = {
      primaryContactName: String(fd.get("primaryContactName") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      preferredComm,
      country: String(fd.get("country") || ""),
      stateProvince: String(fd.get("stateProvince") || ""),
      city: String(fd.get("city") || ""),
      stylingFor,
      stylingOther: String(fd.get("stylingOther") || ""),
      stylingExperience,
      weddingDate: String(fd.get("weddingDate") || ""),
      stage,
      weddingCountry: String(fd.get("weddingCountry") || ""),
      weddingState: String(fd.get("weddingState") || ""),
      weddingCity: String(fd.get("weddingCity") || ""),
      venue: String(fd.get("venue") || ""),
      weddingCulture,
      cultureOther: String(fd.get("cultureOther") || ""),
      additionalEvents,
      eventsOther: String(fd.get("eventsOther") || ""),
      fabricProvider,
      fabricCombinationNote: String(fd.get("fabricCombinationNote") || ""),
      preferredFabrics: String(fd.get("preferredFabrics") || ""),
      preferredColourPalette: String(fd.get("preferredColourPalette") || ""),
      specialRequests: String(fd.get("specialRequests") || ""),
      partyBride: String(fd.get("partyBride") || ""),
      partyGroom: String(fd.get("partyGroom") || ""),
      partyBridesmaids: String(fd.get("partyBridesmaids") || ""),
      partyGroomsmen: String(fd.get("partyGroomsmen") || ""),
      partyParents: String(fd.get("partyParents") || ""),
      partyOther: String(fd.get("partyOther") || ""),
      experienceType,
      consultationStart,
      fittingsOption,
      timeline,
      plannerName: String(fd.get("plannerName") || ""),
      plannerCompany: String(fd.get("plannerCompany") || ""),
      plannerPhone: String(fd.get("plannerPhone") || ""),
      plannerEmail: String(fd.get("plannerEmail") || ""),
      hearAbout,
      hearOther: String(fd.get("hearOther") || ""),
      additionalNotes: String(fd.get("additionalNotes") || ""),
      confirmed,
    };

    try {
      const res = await fetch("/api/bridal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("ok");
      setMessage("Your Bridal brief is with the house. We’ll be in touch to schedule your consultation.");
      form.reset();
      setPreferredComm([]);
      setStylingFor([]);
      setStylingExperience([]);
      setStage("");
      setWeddingCulture([]);
      setAdditionalEvents([]);
      setFabricProvider("");
      setExperienceType("");
      setConsultationStart("");
      setFittingsOption("");
      setTimeline("");
      setHearAbout([]);
      setConfirmed(false);
      setStep(0);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not send your bridal brief");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <EditableSection cmsKey="bridal_video" label="Bridal video" className="block">
        <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-mkos-ink text-white">
          <div className="absolute inset-0 bg-black">
            <AutoplayVideo
              src={bridal?.media_url ?? "/videos/bridal-hero.mp4"}
              whenVisible={false}
              eager
              className="h-full w-full object-cover opacity-75"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(196,92,38,0.22),transparent_55%)]" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-20">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[11px] tracking-[0.4em] text-white/60 uppercase"
            >
              {bridal?.eyebrow ?? "Client Bridal Brief"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl lg:text-7xl"
            >
              {bridal?.title ?? "Begin your MKoS Bridal experience"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-6 max-w-xl text-base text-white/75 sm:text-lg"
            >
              {bridal?.body ??
                bridal?.subtitle ??
                "Thank you for choosing MKoS. Complete this bridal brief so our atelier can understand your wedding vision, styling needs, and celebration details — then craft a look made exclusively for you."}
            </motion.p>
          </div>
        </section>
      </EditableSection>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12 lg:py-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="h-px w-full overflow-hidden bg-mkos-border">
            <motion.div
              className="h-full bg-mkos-ink"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ol className="mt-8 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-start gap-4 text-left transition-colors",
                    i === step ? "text-mkos-ink" : "text-mkos-muted hover:text-mkos-ink"
                  )}
                >
                  <span className="mt-1 font-display text-[10px] tracking-[0.22em] uppercase">
                    0{i + 1}
                  </span>
                  <span>
                    <span className="block font-display text-lg tracking-tight">{s.label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <ScrollReveal y={20} className="mt-10">
            <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
              Bridal atelier
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Made for your vows.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mkos-muted sm:text-base">
              Every response helps us create a bespoke bridal experience tailored exclusively to you
              — with intention, craftsmanship, and timeless elegance.
            </p>
            <div className="mt-8 space-y-2 text-sm text-mkos-muted">
              <p className="font-display text-[10px] tracking-[0.22em] text-mkos-ink uppercase">
                Showroom
              </p>
              <p>Oniru, Victoria Island, Lagos, Nigeria.</p>
              <p className="pt-2">
                <a
                  href="https://www.instagram.com/shopmykindofstyle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mkos-ink"
                >
                  @shopmykindofstyle
                </a>
                {" · "}
                <a
                  href="https://www.instagram.com/mkosformen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mkos-ink"
                >
                  @mkosformen
                </a>
              </p>
              <p>
                <a href="mailto:styleme@mykindofstyle.com" className="hover:text-mkos-ink">
                  styleme@mykindofstyle.com
                </a>
              </p>
            </div>
          </ScrollReveal>
        </aside>

        <form onSubmit={onSubmit} className="border border-mkos-border bg-white p-6 sm:p-10">
          {/* Step 0 — About You */}
          <div className={step === 0 ? "space-y-8" : "hidden"}>
            <SectionTitle n="01" title="About You" />
            <div>
              <FieldLabel>Primary contact name</FieldLabel>
              <TextInput name="primaryContactName" required={step === 0} autoComplete="name" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <TextInput name="phone" type="tel" required={step === 0} autoComplete="tel" />
              </div>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <TextInput name="email" type="email" required={step === 0} autoComplete="email" />
              </div>
            </div>
            <div>
              <FieldLabel>Preferred method of communication</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {COMM.map((c) => (
                  <Chip
                    key={c}
                    active={preferredComm.includes(c)}
                    onClick={() => setPreferredComm((s) => toggle(s, c))}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Your location</FieldLabel>
              <div className="mt-2 grid gap-6 sm:grid-cols-3">
                <TextInput name="country" placeholder="Country" />
                <TextInput name="stateProvince" placeholder="State / Province" />
                <TextInput name="city" placeholder="City" />
              </div>
            </div>
          </div>

          {/* Step 1 — Who & Styling */}
          <div className={step === 1 ? "space-y-10" : "hidden"}>
            <div>
              <SectionTitle n="02" title="Who are we styling?" />
              <div className="flex flex-wrap gap-2">
                {STYLING_FOR.map((t) => (
                  <Chip
                    key={t}
                    active={stylingFor.includes(t)}
                    onClick={() => setStylingFor((s) => toggle(s, t))}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {stylingFor.includes("Other") && (
                <div className="mt-4">
                  <FieldLabel>If other, please specify</FieldLabel>
                  <TextInput name="stylingOther" />
                </div>
              )}
            </div>

            <div>
              <SectionTitle n="03" title="Styling experience" />
              <div className="space-y-6">
                {STYLING_EXPERIENCE.map((block) => (
                  <div key={block.group}>
                    <p className="mb-3 font-display text-[11px] tracking-[0.2em] text-mkos-ink uppercase">
                      {block.group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {block.options.map((o) => (
                        <Chip
                          key={o}
                          active={stylingExperience.includes(o)}
                          onClick={() => setStylingExperience((s) => toggle(s, o))}
                        >
                          {o}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 — Celebration */}
          <div className={step === 2 ? "space-y-8" : "hidden"}>
            <SectionTitle n="04" title="Your celebration" />
            <div>
              <FieldLabel>Wedding date</FieldLabel>
              <TextInput name="weddingDate" type="date" />
            </div>
            <div>
              <FieldLabel>What stage are you currently in?</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Chip key={s} active={stage === s} onClick={() => setStage(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Wedding location</FieldLabel>
              <div className="mt-2 grid gap-6 sm:grid-cols-3">
                <TextInput name="weddingCountry" placeholder="Country" />
                <TextInput name="weddingState" placeholder="State / Province" />
                <TextInput name="weddingCity" placeholder="City" />
              </div>
              <div className="mt-4">
                <FieldLabel>Venue (optional)</FieldLabel>
                <TextInput name="venue" />
              </div>
            </div>
            <div>
              <FieldLabel>Wedding culture</FieldLabel>
              <p className="mb-3 text-xs text-mkos-muted">
                Complete if Traditional Attire is selected.
              </p>
              <div className="flex flex-wrap gap-2">
                {CULTURES.map((c) => (
                  <Chip
                    key={c}
                    active={weddingCulture.includes(c)}
                    onClick={() => setWeddingCulture((s) => toggle(s, c))}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
              {weddingCulture.includes("Other") && (
                <div className="mt-4">
                  <FieldLabel>Other culture</FieldLabel>
                  <TextInput name="cultureOther" />
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Will you require styling for additional events?</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXTRA_EVENTS.map((ev) => (
                  <Chip
                    key={ev}
                    active={additionalEvents.includes(ev)}
                    onClick={() => setAdditionalEvents((s) => toggle(s, ev))}
                  >
                    {ev}
                  </Chip>
                ))}
              </div>
              {additionalEvents.includes("Other") && (
                <div className="mt-4">
                  <FieldLabel>Other event</FieldLabel>
                  <TextInput name="eventsOther" />
                </div>
              )}
            </div>
          </div>

          {/* Step 3 — Materials + Party + Experience */}
          <div className={step === 3 ? "space-y-10" : "hidden"}>
            <div>
              <SectionTitle n="05" title="Your materials" />
              <FieldLabel>Who will provide the fabrics/materials?</FieldLabel>
              <div className="mt-3 space-y-2">
                {FABRIC_PROVIDERS.map((f) => (
                  <label
                    key={f}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm transition-colors",
                      fabricProvider === f ? "border-mkos-ink bg-mkos-warm/50" : "border-mkos-border"
                    )}
                  >
                    <input
                      type="radio"
                      className="mt-1 accent-mkos-ink"
                      checked={fabricProvider === f}
                      onChange={() => setFabricProvider(f)}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
              {fabricProvider === "Combination of both" && (
                <div className="mt-4">
                  <FieldLabel>If combination, please tell us more</FieldLabel>
                  <TextArea name="fabricCombinationNote" />
                </div>
              )}
              {(fabricProvider === "MKoS will source and provide all fabrics/materials" ||
                fabricProvider === "Combination of both") && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Preferred fabric(s)</FieldLabel>
                    <TextInput name="preferredFabrics" />
                  </div>
                  <div>
                    <FieldLabel>Preferred colour palette</FieldLabel>
                    <TextInput name="preferredColourPalette" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Special requests</FieldLabel>
                    <TextArea name="specialRequests" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionTitle n="06" title="Your bridal party" />
              <p className="mb-4 text-sm text-mkos-muted">How many people are we styling?</p>
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <FieldLabel>Bride</FieldLabel>
                  <TextInput name="partyBride" type="number" min={0} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Groom</FieldLabel>
                  <TextInput name="partyGroom" type="number" min={0} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Bridesmaids</FieldLabel>
                  <TextInput name="partyBridesmaids" type="number" min={0} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Groomsmen</FieldLabel>
                  <TextInput name="partyGroomsmen" type="number" min={0} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Parents</FieldLabel>
                  <TextInput name="partyParents" type="number" min={0} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Other</FieldLabel>
                  <TextInput name="partyOther" type="number" min={0} placeholder="0" />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle n="07" title="Your MKoS experience" />
              <div className="space-y-2">
                {EXPERIENCES.map((ex) => (
                  <label
                    key={ex}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm transition-colors",
                      experienceType === ex
                        ? "border-mkos-ink bg-mkos-warm/50"
                        : "border-mkos-border"
                    )}
                  >
                    <input
                      type="radio"
                      className="mt-1 accent-mkos-ink"
                      checked={experienceType === ex}
                      onChange={() => setExperienceType(ex)}
                    />
                    <span>{ex}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4 — Consultation + Planner + Submit */}
          <div className={step === 4 ? "space-y-10" : "hidden"}>
            <div>
              <SectionTitle n="08" title="Consultation & fittings" />
              <FieldLabel>How would you like to begin?</FieldLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {CONSULTATION.map((c) => (
                  <Chip
                    key={c}
                    active={consultationStart === c}
                    onClick={() => setConsultationStart(c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
              <div className="mt-6">
                <FieldLabel>
                  Are you willing and able to attend fittings at the MKoS Atelier in Lagos?
                </FieldLabel>
                <div className="mt-3 space-y-2">
                  {FITTINGS.map((f) => (
                    <label
                      key={f}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm",
                        fittingsOption === f
                          ? "border-mkos-ink bg-mkos-warm/50"
                          : "border-mkos-border"
                      )}
                    >
                      <input
                        type="radio"
                        className="mt-1 accent-mkos-ink"
                        checked={fittingsOption === f}
                        onChange={() => setFittingsOption(f)}
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <FieldLabel>When do you need your outfit(s) completed?</FieldLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIMELINES.map((t) => (
                    <Chip key={t} active={timeline === t} onClick={() => setTimeline(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionTitle n="09" title="Wedding planner / coordinator" />
              <p className="mb-4 text-xs text-mkos-muted">Optional</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>Planner’s name</FieldLabel>
                  <TextInput name="plannerName" />
                </div>
                <div>
                  <FieldLabel>Company</FieldLabel>
                  <TextInput name="plannerCompany" />
                </div>
                <div>
                  <FieldLabel>Phone number</FieldLabel>
                  <TextInput name="plannerPhone" type="tel" />
                </div>
                <div>
                  <FieldLabel>Email address</FieldLabel>
                  <TextInput name="plannerEmail" type="email" />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle n="10" title="How did you hear about MKoS?" />
              <div className="flex flex-wrap gap-2">
                {HEAR.map((h) => (
                  <Chip
                    key={h}
                    active={hearAbout.includes(h)}
                    onClick={() => setHearAbout((s) => toggle(s, h))}
                  >
                    {h}
                  </Chip>
                ))}
              </div>
              {hearAbout.includes("Other") && (
                <div className="mt-4">
                  <FieldLabel>Other</FieldLabel>
                  <TextInput name="hearOther" />
                </div>
              )}
            </div>

            <div>
              <SectionTitle n="11" title="Additional notes" />
              <TextArea
                name="additionalNotes"
                placeholder="Anything you’d like our atelier to know before your consultation…"
              />
            </div>

            <div className="border border-mkos-border bg-[#f7f4ef] p-6">
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
                Begin your MKoS Bridal experience
              </p>
              <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
                Thank you for choosing MKoS. Your bridal brief will be personally reviewed by our
                atelier. Once received, our team will contact you to schedule your consultation.
              </p>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-mkos-ink">
                <input
                  type="checkbox"
                  className="mt-1 accent-mkos-ink"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>I confirm that the information provided is accurate.</span>
              </label>
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
                  : "Submit my bridal brief"}
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

      <div className="border-t border-mkos-border bg-white px-5 py-12 text-center sm:px-8">
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
          Showroom · Oniru, Victoria Island, Lagos
        </p>
        <p className="mt-3 text-sm text-mkos-muted">
          Thank you for letting us be part of your special moment.
        </p>
        <p className="mt-4 font-display text-[11px] tracking-[0.35em] text-mkos-ink uppercase">
          MKoS — My Kind of Style
        </p>
      </div>
    </div>
  );
}
