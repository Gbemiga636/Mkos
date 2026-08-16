import { NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { sendStyleBriefEmails, type StyleBriefAttachment } from "@/lib/email/send";
import type { StyleBriefPayload } from "@/lib/email/styleBriefEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILES = 5;
const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

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
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    const attachments: StyleBriefAttachment[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") {
          body[key] = value;
          continue;
        }
        if (key === "inspirationPhotos" && value instanceof File && value.size > 0) {
          if (attachments.length >= MAX_FILES) continue;
          if (value.size > MAX_FILE_BYTES) {
            return NextResponse.json(
              { error: `${value.name} is too large (max 2.5MB per photo)` },
              { status: 400 }
            );
          }
          const buf = Buffer.from(await value.arrayBuffer());
          attachments.push({
            filename: value.name || `inspiration-${attachments.length + 1}.jpg`,
            content: buf,
          });
        }
      }
    } else {
      body = await req.json();
    }

    const fullName = clean(body.fullName);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Please share your full name" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Please share your phone number" }, { status: 400 });
    }

    const eventTypes = parseList(body.eventTypes);
    const outfitTypes = parseList(body.outfitTypes);
    const deliveryMethod = clean(body.deliveryMethod);
    const contentPermission = clean(body.contentPermission);
    const measurementsOption = clean(body.measurementsOption);

    if (!eventTypes.length && !clean(body.eventOther)) {
      return NextResponse.json({ error: "Please select a type of event" }, { status: 400 });
    }
    if (!outfitTypes.length && !clean(body.outfitOther)) {
      return NextResponse.json({ error: "Please tell us what you’d like us to create" }, { status: 400 });
    }
    if (!measurementsOption) {
      return NextResponse.json({ error: "Please choose a measurements option" }, { status: 400 });
    }
    if (!contentPermission) {
      return NextResponse.json(
        { error: "Please tell us if we may feature you in MKoS Experience content" },
        { status: 400 }
      );
    }
    if (!deliveryMethod) {
      return NextResponse.json({ error: "Please choose a preferred delivery method" }, { status: 400 });
    }

    const payload: StyleBriefPayload = {
      fullName,
      phone,
      email,
      instagram: clean(body.instagram) || undefined,
      eventTypes,
      eventOther: clean(body.eventOther) || undefined,
      eventDate: clean(body.eventDate) || undefined,
      outfitNeededBy: clean(body.outfitNeededBy) || undefined,
      outfitTypes,
      outfitOther: clean(body.outfitOther) || undefined,
      preferredStyle: clean(body.preferredStyle) || undefined,
      preferredFabric: clean(body.preferredFabric) || undefined,
      preferredColors: clean(body.preferredColors) || undefined,
      avoidColors: clean(body.avoidColors) || undefined,
      measurementsOption,
      pastOrderNotes: clean(body.pastOrderNotes) || undefined,
      budget: clean(body.budget) || undefined,
      additionalRequests: clean(body.additionalRequests) || undefined,
      contentPermission,
      deliveryMethod,
      deliveryAddress: clean(body.deliveryAddress) || undefined,
      inspirationNote: clean(body.inspirationNote) || undefined,
    };

    const sb = createServiceClient();
    const { data: row, error } = await sb
      .from("style_briefs")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        payload: {
          ...payload,
          inspirationPhotoCount: attachments.length,
        },
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[style-brief] DB insert skipped:", error.message);
    }

    after(async () => {
      try {
        await sendStyleBriefEmails(payload, attachments);
      } catch (err) {
        console.warn("[style-brief] email failed", err);
      }
      try {
        await sb.from("admin_notifications").insert({
          kind: "style_brief",
          title: `Style brief · ${fullName}`,
          body: `${email} · ${eventTypes.join(", ") || "Event"} · ${outfitTypes.join(", ") || "Outfit"}`,
          href: "/admin/style-briefs",
        });
      } catch {
        /* optional */
      }
    });

    return NextResponse.json({
      ok: true,
      id: row?.id ?? null,
      emailed: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
