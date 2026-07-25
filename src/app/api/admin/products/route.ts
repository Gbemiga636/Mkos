import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/cms/revalidate";

async function requireAdmin() {
  return getSessionAdmin();
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb.from("products").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = createServiceClient();

  const existingId = body.id ? String(body.id) : "";
  let existing: Record<string, unknown> | null = null;
  if (existingId) {
    const { data } = await sb.from("products").select("*").eq("id", existingId).maybeSingle();
    existing = data;
  }

  const id = existingId || `mk-${Date.now()}`;
  const name = String(body.name || existing?.name || "Untitled");
  const slug =
    String(body.slug || existing?.slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || id;

  const row = {
    id,
    slug,
    name,
    tagline: body.tagline ?? existing?.tagline ?? "",
    description: body.description ?? existing?.description ?? "",
    story: body.story ?? existing?.story ?? "",
    price: Number(body.price ?? existing?.price ?? 0),
    compare_at:
      body.compareAt != null
        ? Number(body.compareAt)
        : existing?.compare_at != null
          ? Number(existing.compare_at)
          : null,
    images: body.images ?? existing?.images ?? [],
    category_slug: body.category ?? existing?.category_slug ?? null,
    collection_slug: body.collection ?? existing?.collection_slug ?? null,
    colors: body.colors ?? existing?.colors ?? [],
    sizes: body.sizes ?? existing?.sizes ?? [],
    material: body.material ?? existing?.material ?? "",
    stock: Number(body.stock ?? existing?.stock ?? 0),
    tags: body.tags ?? existing?.tags ?? [],
    featured: body.featured ?? existing?.featured ?? false,
    new_arrival: body.newArrival ?? existing?.new_arrival ?? false,
    best_seller: body.bestSeller ?? existing?.best_seller ?? false,
    trending: body.trending ?? existing?.trending ?? false,
    is_published: body.isPublished ?? existing?.is_published ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb.from("products").upsert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "product_upsert", "products", id, { name, slug });
  revalidateStorefront([`/product/${slug}`, "/admin/products"]);
  return NextResponse.json({ product: data });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "product_delete", "products", id);
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
