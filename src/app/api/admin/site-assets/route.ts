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
        const name = String(item.name || "").trim();
        const slug = String(item.slug || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!name) return NextResponse.json({ error: "Category name required" }, { status: 400 });

        if (!id) {
          if (!slug) {
            return NextResponse.json({ error: "Category slug required" }, { status: 400 });
          }
          const { count } = await sb
            .from("categories")
            .select("*", { count: "exact", head: true });
          const { data, error } = await sb
            .from("categories")
            .insert({
              slug,
              name,
              description: item.description ?? "",
              image_url: item.image_url || null,
              sort_order: Number(item.sort_order ?? count ?? 0),
              is_published: item.is_published !== false,
            })
            .select("*")
            .single();
          if (error) throw error;
          await writeAudit(session.admin.id, "category_create", "categories", data.id);
          revalidateStorefront(["/shop"]);
          return NextResponse.json({ item: data });
        }

        const patch = {
          name,
          ...(item.slug ? { slug } : {}),
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
        revalidateStorefront(["/shop"]);
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
        const name = String(item.name || "").trim();
        const slug = String(item.slug || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!name) return NextResponse.json({ error: "Collection name required" }, { status: 400 });

        if (!id) {
          if (!slug) {
            return NextResponse.json({ error: "Collection slug required" }, { status: 400 });
          }
          const { count } = await sb
            .from("collections")
            .select("*", { count: "exact", head: true });
          const insertRow: Record<string, unknown> = {
            slug,
            name,
            description: item.description ?? "",
            image_url: item.image_url || null,
            video_url: item.video_url || null,
            sort_order: Number(item.sort_order ?? count ?? 0),
            is_published: item.is_published !== false,
          };
          if (item.image_focus != null) {
            insertRow.image_focus = item.image_focus;
          } else if (slug === "bridal") {
            insertRow.image_focus = { x: 50, y: 28 };
          }
          let { data, error } = await sb.from("collections").insert(insertRow).select("*").single();
          if (error && /image_focus/i.test(error.message) && "image_focus" in insertRow) {
            const rest = { ...insertRow };
            delete rest.image_focus;
            ({ data, error } = await sb.from("collections").insert(rest).select("*").single());
          }
          if (error) throw error;
          await writeAudit(session.admin.id, "collection_create", "collections", data.id);
          revalidateStorefront(["/", "/shop"]);
          return NextResponse.json({ item: data });
        }

        const patch: Record<string, unknown> = {
          name,
          ...(item.slug ? { slug } : {}),
          description: item.description,
          image_url: item.image_url,
          video_url: item.video_url ?? null,
          is_published: item.is_published !== false,
          updated_at: new Date().toISOString(),
        };
        if (item.image_focus != null) {
          patch.image_focus = item.image_focus;
        }
        let { data, error } = await sb
          .from("collections")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();
        if (error && /image_focus/i.test(error.message) && "image_focus" in patch) {
          const withoutFocus = { ...patch };
          delete withoutFocus.image_focus;
          ({ data, error } = await sb
            .from("collections")
            .update(withoutFocus)
            .eq("id", id)
            .select("*")
            .single());
          // Persist focus on featured_collections.extra until migration is applied
          if (!error && item.image_focus && data?.slug) {
            const { data: block } = await sb
              .from("site_content")
              .select("extra")
              .eq("key", "featured_collections")
              .maybeSingle();
            const extra = {
              ...((block?.extra as Record<string, unknown>) || {}),
              collectionFocus: {
                ...(((block?.extra as Record<string, unknown>)?.collectionFocus as Record<
                  string,
                  unknown
                >) || {}),
                [String(data.slug)]: item.image_focus,
              },
            };
            await sb.from("site_content").upsert({
              key: "featured_collections",
              section: "featured_collections",
              extra,
              is_published: true,
              updated_at: new Date().toISOString(),
            });
            data = { ...data, image_focus: item.image_focus };
          }
        }
        if (error) throw error;
        await writeAudit(session.admin.id, "collection_update", "collections", id);
        revalidateStorefront(["/", "/shop"]);
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
