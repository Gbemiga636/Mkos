import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { sendBridalEmails } from "@/lib/email/send";
import type { BridalBriefPayload } from "@/lib/email/bridalEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: unknown) {
  return String(s ?? "").trim();
}

function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  const s = clean(raw);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
  } catch {
    /* comma-separated */
  }
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const primaryContactName = clean(body.primaryContactName);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);

    if (!primaryContactName || primaryContactName.length < 2) {
      return NextResponse.json({ error: "Please share the primary contact name" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Please share your phone number" }, { status: 400 });
    }
    if (!body.confirmed) {
      return NextResponse.json(
        { error: "Please confirm the information provided is accurate" },
        { status: 400 }
      );
    }

    const stylingFor = parseList(body.stylingFor);
    if (!stylingFor.length && !clean(body.stylingOther)) {
      return NextResponse.json({ error: "Please tell us who we are styling" }, { status: 400 });
    }

    const payload: BridalBriefPayload = {
      primaryContactName,
      phone,
      email,
      preferredComm: parseList(body.preferredComm),
      country: clean(body.country),
      stateProvince: clean(body.stateProvince),
      city: clean(body.city),
      stylingFor,
      stylingOther: clean(body.stylingOther) || undefined,
      stylingExperience: parseList(body.stylingExperience),
      weddingDate: clean(body.weddingDate) || undefined,
      stage: clean(body.stage) || undefined,
      weddingCountry: clean(body.weddingCountry) || undefined,
      weddingState: clean(body.weddingState) || undefined,
      weddingCity: clean(body.weddingCity) || undefined,
      venue: clean(body.venue) || undefined,
      weddingCulture: parseList(body.weddingCulture),
      cultureOther: clean(body.cultureOther) || undefined,
      additionalEvents: parseList(body.additionalEvents),
      eventsOther: clean(body.eventsOther) || undefined,
      fabricProvider: clean(body.fabricProvider) || undefined,
      fabricCombinationNote: clean(body.fabricCombinationNote) || undefined,
      preferredFabrics: clean(body.preferredFabrics) || undefined,
      preferredColourPalette: clean(body.preferredColourPalette) || undefined,
      specialRequests: clean(body.specialRequests) || undefined,
      partyBride: clean(body.partyBride) || undefined,
      partyGroom: clean(body.partyGroom) || undefined,
      partyBridesmaids: clean(body.partyBridesmaids) || undefined,
      partyGroomsmen: clean(body.partyGroomsmen) || undefined,
      partyParents: clean(body.partyParents) || undefined,
      partyOther: clean(body.partyOther) || undefined,
      experienceType: clean(body.experienceType) || undefined,
      consultationStart: clean(body.consultationStart) || undefined,
      fittingsOption: clean(body.fittingsOption) || undefined,
      timeline: clean(body.timeline) || undefined,
      plannerName: clean(body.plannerName) || undefined,
      plannerCompany: clean(body.plannerCompany) || undefined,
      plannerPhone: clean(body.plannerPhone) || undefined,
      plannerEmail: clean(body.plannerEmail) || undefined,
      hearAbout: parseList(body.hearAbout),
      hearOther: clean(body.hearOther) || undefined,
      additionalNotes: clean(body.additionalNotes) || undefined,
    };

    const sb = createServiceClient();
    const { data: row, error } = await sb
      .from("style_briefs")
      .insert({
        full_name: primaryContactName,
        email,
        phone: phone || null,
        payload: { ...payload, kind: "bridal" },
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[bridal] DB insert skipped:", error.message);
    }

    const emailResult = await sendBridalEmails(payload);

    try {
      await sb.from("admin_notifications").insert({
        kind: "bridal",
        title: `Bridal · ${primaryContactName}`,
        body: `${email} · ${stylingFor.join(", ") || "Bridal party"} · ${payload.weddingDate || "Date TBD"}`,
        href: "/admin/style-briefs",
      });
    } catch {
      /* optional */
    }

    return NextResponse.json({
      ok: true,
      id: row?.id ?? null,
      emailed: emailResult.sent,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
