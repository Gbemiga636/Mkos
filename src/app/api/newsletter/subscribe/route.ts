import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email || ""));
    const source = String(body.source || "popup").slice(0, 40);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const sb = createServiceClient();
    const { error } = await sb.from("newsletter_subscribers").insert({ email, source });

    if (error) {
      if (/does not exist|schema cache/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              "Subscriber list is not set up yet. Run migration 013_newsletter_subscribers.sql in Supabase.",
          },
          { status: 503 }
        );
      }
      if (/duplicate|unique/i.test(error.message)) {
        return NextResponse.json({ ok: true, already: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, already: false, email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not subscribe" },
      { status: 500 }
    );
  }
}
