import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb.from("site_content").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}

export async function PUT(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const key = String(body.key || "");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const sb = createServiceClient();
  const patch = {
    title: body.title ?? null,
    subtitle: body.subtitle ?? null,
    body: body.body ?? null,
    eyebrow: body.eyebrow ?? null,
    cta_label: body.cta_label ?? null,
    cta_href: body.cta_href ?? null,
    media_url: body.media_url ?? null,
    media_type: body.media_type ?? null,
    extra: body.extra ?? {},
    is_published: body.is_published !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from("site_content")
    .update(patch)
    .eq("key", key)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "content_update", "site_content", key);
  revalidateStorefront();
  return NextResponse.json({ content: data });
}
