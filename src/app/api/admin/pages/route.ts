import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb.from("site_pages").select("*").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ pages: [] });
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title || "Untitled page");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("site_pages")
    .insert({ title, slug, status: "draft", sections: [] })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "page_create", "site_pages", data.id);
  return NextResponse.json({ page: data });
}
