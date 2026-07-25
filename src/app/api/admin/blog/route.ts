import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ posts: [] });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title || "Untitled");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: body.excerpt ?? "",
      body: body.body ?? "",
      status: "draft",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "blog_create", "blog_posts", data.id);
  return NextResponse.json({ post: data });
}
