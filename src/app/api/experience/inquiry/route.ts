import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { sendExperienceInquiryEmails } from "@/lib/email/send";
import type { ExperienceInquiryPayload } from "@/lib/email/experienceEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: unknown) {
  return String(s ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = body.kind === "full_glam" ? "full_glam" : body.kind === "content" ? "content" : null;
    if (!kind) {
      return NextResponse.json({ error: "Invalid inquiry type" }, { status: 400 });
    }

    const fullName = clean(body.fullName);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Please share your name" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const payload: ExperienceInquiryPayload = {
      kind,
      fullName,
      email,
      phone: phone || undefined,
    };

    if (kind === "content") {
      payload.filmed = clean(body.filmed) || undefined;
      payload.posted = clean(body.posted) || undefined;
      payload.visitWindow = clean(body.visitWindow) || undefined;
      payload.contentNotes = clean(body.contentNotes) || undefined;
      if (!payload.filmed || !payload.posted) {
        return NextResponse.json(
          { error: "Please tell us how you feel about filming and posting" },
          { status: 400 }
        );
      }
    } else {
      payload.eventType = clean(body.eventType) || undefined;
      payload.eventDate = clean(body.eventDate) || undefined;
      payload.services = Array.isArray(body.services)
        ? body.services.map(String).filter(Boolean)
        : [];
      payload.consultation = clean(body.consultation) || undefined;
      payload.glamNotes = clean(body.glamNotes) || undefined;
      if (!payload.eventType) {
        return NextResponse.json({ error: "Please share your event type" }, { status: 400 });
      }
      if (!payload.services?.length) {
        return NextResponse.json(
          { error: "Select at least one Full Glam service" },
          { status: 400 }
        );
      }
    }

    const sb = createServiceClient();
    const { data: row, error } = await sb
      .from("experience_inquiries")
      .insert({
        kind,
        full_name: fullName,
        email,
        phone: phone || null,
        payload,
        status: "new",
      })
      .select("id")
      .single();

    // If table not migrated yet, still email admin so nothing is lost
    if (error) {
      console.warn("[experience] DB insert skipped:", error.message);
    }

    const emailResult = await sendExperienceInquiryEmails(payload);

    try {
      await sb.from("admin_notifications").insert({
        kind: "experience",
        title:
          kind === "full_glam"
            ? `Full Glam · ${fullName}`
            : `Experience content · ${fullName}`,
        body:
          kind === "full_glam"
            ? `${email} · ${(payload.services || []).join(", ")} · ${payload.eventType || "Event"}`
            : `${email} · filmed: ${payload.filmed} · posted: ${payload.posted}`,
        href: "/admin/experience",
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
