import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { estimateReadingTime, slugifyTitle } from "@/lib/blog";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ posts: [] });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title || "Untitled");
  const slug = body.slug ? slugifyTitle(String(body.slug)) : slugifyTitle(title);
  const status = body.status === "published" ? "published" : "draft";
  const postBody = String(body.body ?? "");
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: body.excerpt ?? "",
      body: postBody,
      cover_image: body.cover_image || null,
      author_name: body.author_name || "MKOS",
      tags: Array.isArray(body.tags) ? body.tags : [],
      status,
      reading_time: estimateReadingTime(postBody),
      meta_title: body.meta_title || title,
      meta_description: body.meta_description || body.excerpt || "",
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "blog_create", "blog_posts", data.id);
  revalidateStorefront(["/blog", `/blog/${slug}`]);
  return NextResponse.json({ post: data });
}

export async function PATCH(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title != null) patch.title = String(body.title);
  if (body.excerpt != null) patch.excerpt = String(body.excerpt);
  if (body.body != null) {
    patch.body = String(body.body);
    patch.reading_time = estimateReadingTime(String(body.body));
  }
  if (body.cover_image != null) patch.cover_image = body.cover_image || null;
  if (body.meta_title != null) patch.meta_title = String(body.meta_title);
  if (body.meta_description != null) patch.meta_description = String(body.meta_description);
  if (body.tags != null) patch.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.author_name != null) patch.author_name = String(body.author_name);
  if (body.slug != null) patch.slug = slugifyTitle(String(body.slug));

  if (body.status === "published") {
    patch.status = "published";
    patch.published_at = body.published_at || new Date().toISOString();
  } else if (body.status === "draft") {
    patch.status = "draft";
  }

  const { data, error } = await sb.from("blog_posts").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "blog_update", "blog_posts", id, { status: data.status });
  revalidateStorefront(["/blog", `/blog/${data.slug}`]);
  return NextResponse.json({ post: data });
}

export async function DELETE(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createServiceClient();
  const { data: existing } = await sb.from("blog_posts").select("slug").eq("id", id).maybeSingle();
  const { error } = await sb.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "blog_delete", "blog_posts", id);
  revalidateStorefront(["/blog", existing?.slug ? `/blog/${existing.slug}` : "/blog"]);
  return NextResponse.json({ ok: true });
}
