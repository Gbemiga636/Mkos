import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const [carousel, categories, collections, products, reviews, faqs] = await Promise.all([
    sb.from("carousel_slides").select("*").order("sort_order"),
    sb.from("categories").select("*").order("sort_order"),
    sb.from("collections").select("*").order("sort_order"),
    sb
      .from("products")
      .select(
        "id, slug, name, images, featured, new_arrival, best_seller, trending, is_published, sort_order, price"
      )
      .order("sort_order"),
    sb.from("reviews").select("*").order("sort_order"),
    sb.from("faqs").select("*").order("sort_order"),
  ]);

  const err =
    carousel.error ||
    categories.error ||
    collections.error ||
    products.error ||
    reviews.error ||
    faqs.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({
    carousel: carousel.data ?? [],
    categories: categories.data ?? [],
    collections: collections.data ?? [],
    products: products.data ?? [],
    reviews: reviews.data ?? [],
    faqs: faqs.data ?? [],
  });
}

export async function PUT(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const kind = String(body.kind || "");
  const action = String(body.action || "upsert");
  const sb = createServiceClient();

  try {
    if (kind === "carousel") {
      if (action === "delete") {
        const id = String(body.id || "");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const { error } = await sb.from("carousel_slides").delete().eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "carousel_delete", "carousel_slides", id);
      } else {
        const item = body.item ?? {};
        const row = {
          ...(item.id ? { id: item.id } : {}),
          name: String(item.name || "Slide"),
          image_url: String(item.image_url || ""),
          href: item.href ?? null,
          sort_order: Number(item.sort_order ?? 0),
          is_published: item.is_published !== false,
        };
        if (!row.image_url) {
          return NextResponse.json({ error: "image_url required" }, { status: 400 });
        }
        const { data, error } = await sb
          .from("carousel_slides")
          .upsert(row)
          .select("*")
          .single();
        if (error) throw error;
        await writeAudit(session.admin.id, "carousel_upsert", "carousel_slides", data.id);
        revalidateStorefront();
        return NextResponse.json({ item: data });
      }
    } else if (kind === "category") {
      if (action === "delete") {
        const id = String(body.id || "");
        const { error } = await sb
          .from("categories")
          .update({ is_published: false })
          .eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "category_hide", "categories", id);
      } else {
        const item = body.item ?? {};
        const id = String(item.id || "");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const patch = {
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          is_published: item.is_published !== false,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await sb
          .from("categories")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();
        if (error) throw error;
        await writeAudit(session.admin.id, "category_update", "categories", id);
        revalidateStorefront();
        return NextResponse.json({ item: data });
      }
    } else if (kind === "collection") {
      if (action === "delete") {
        const id = String(body.id || "");
        const { error } = await sb
          .from("collections")
          .update({ is_published: false })
          .eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "collection_hide", "collections", id);
      } else {
        const item = body.item ?? {};
        const id = String(item.id || "");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const patch = {
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          video_url: item.video_url ?? null,
          is_published: item.is_published !== false,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await sb
          .from("collections")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();
        if (error) throw error;
        await writeAudit(session.admin.id, "collection_update", "collections", id);
        revalidateStorefront();
        return NextResponse.json({ item: data });
      }
    } else if (kind === "product") {
      if (action === "delete") {
        const id = String(body.id || "");
        const { error } = await sb.from("products").delete().eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "product_delete", "products", id);
      } else {
        const item = body.item ?? {};
        const id = String(item.id || "");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const { data: existing, error: findErr } = await sb
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (findErr) throw findErr;
        const patch = {
          name: item.name ?? existing.name,
          images: item.images ?? existing.images,
          featured: item.featured ?? existing.featured,
          new_arrival: item.new_arrival ?? existing.new_arrival,
          best_seller: item.best_seller ?? existing.best_seller,
          trending: item.trending ?? existing.trending,
          is_published: item.is_published ?? existing.is_published,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await sb
          .from("products")
          .update(patch)
          .eq("id", id)
          .select(
            "id, slug, name, images, featured, new_arrival, best_seller, trending, is_published, sort_order, price"
          )
          .single();
        if (error) throw error;
        await writeAudit(session.admin.id, "product_update", "products", id);
        revalidateStorefront([`/product/${data.slug}`]);
        return NextResponse.json({ item: data });
      }
    } else if (kind === "review") {
      if (action === "delete") {
        const id = String(body.id || "");
        const { error } = await sb.from("reviews").delete().eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "review_delete", "reviews", id);
      } else {
        const item = body.item ?? {};
        const row = {
          ...(item.id ? { id: item.id } : {}),
          author_name: String(item.author_name || "Client"),
          location: item.location ?? "",
          rating: Number(item.rating ?? 5),
          body: String(item.body || ""),
          product_name: item.product_name ?? "",
          sort_order: Number(item.sort_order ?? 0),
          is_published: item.is_published !== false,
        };
        const { data, error } = await sb.from("reviews").upsert(row).select("*").single();
        if (error) throw error;
        await writeAudit(session.admin.id, "review_upsert", "reviews", data.id);
        revalidateStorefront();
        return NextResponse.json({ item: data });
      }
    } else if (kind === "faq") {
      if (action === "delete") {
        const id = String(body.id || "");
        const { error } = await sb.from("faqs").delete().eq("id", id);
        if (error) throw error;
        await writeAudit(session.admin.id, "faq_delete", "faqs", id);
      } else {
        const item = body.item ?? {};
        const row = {
          ...(item.id ? { id: item.id } : {}),
          question: String(item.question || ""),
          answer: String(item.answer || ""),
          sort_order: Number(item.sort_order ?? 0),
          is_published: item.is_published !== false,
        };
        const { data, error } = await sb.from("faqs").upsert(row).select("*").single();
        if (error) throw error;
        await writeAudit(session.admin.id, "faq_upsert", "faqs", data.id);
        revalidateStorefront();
        return NextResponse.json({ item: data });
      }
    } else {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
