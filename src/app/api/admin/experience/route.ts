import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("experience_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message, inquiries: [] }, { status: 200 });
  }

  return NextResponse.json({ inquiries: data ?? [] });
}

export async function PATCH(req: Request) {
  const session = await getSessionAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || !["new", "contacted", "booked", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { error } = await sb
    .from("experience_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
