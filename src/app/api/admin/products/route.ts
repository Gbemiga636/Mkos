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
  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("sort_order")
    .order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = createServiceClient();

  const batch = Array.isArray(body.products) ? body.products : null;
  const inputs = batch ?? [body];

  const saved: Record<string, unknown>[] = [];
  const paths: string[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const item = inputs[i] as Record<string, unknown>;
    const existingId = item.id ? String(item.id) : "";
    let existing: Record<string, unknown> | null = null;
    if (existingId) {
      const { data } = await sb.from("products").select("*").eq("id", existingId).maybeSingle();
      existing = data;
    }

    const id = existingId || `mk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
    const name = String(item.name || existing?.name || "Untitled");
    const slug =
      String(item.slug || existing?.slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || id;

    const row = {
      id,
      slug,
      name,
      tagline: item.tagline ?? existing?.tagline ?? "",
      description: item.description ?? existing?.description ?? "",
      story: item.story ?? existing?.story ?? "",
      price: Number(item.price ?? existing?.price ?? 0),
      compare_at:
        item.compareAt != null
          ? Number(item.compareAt)
          : existing?.compare_at != null
            ? Number(existing.compare_at)
            : null,
      images: item.images ?? existing?.images ?? [],
      category_slug: item.category ?? existing?.category_slug ?? null,
      collection_slug: item.collection ?? existing?.collection_slug ?? null,
      colors: [],
      sizes: item.sizes ?? existing?.sizes ?? [],
      material: item.material ?? existing?.material ?? "",
      stock: Number(item.stock ?? existing?.stock ?? 0),
      tags: item.tags ?? existing?.tags ?? [],
      featured: item.featured ?? existing?.featured ?? false,
      new_arrival: item.newArrival ?? existing?.new_arrival ?? false,
      best_seller: item.bestSeller ?? existing?.best_seller ?? false,
      trending: item.trending ?? existing?.trending ?? false,
      is_published: item.isPublished ?? existing?.is_published ?? true,
      sort_order:
        existing?.sort_order != null
          ? Number(existing.sort_order)
          : Number(item.sort_order ?? -1) >= 0
            ? Number(item.sort_order)
            : undefined,
      updated_at: new Date().toISOString(),
    };

    // New products append after current max sort_order (never steal RTW cover by landing at 0)
    if (row.sort_order == null) {
      const { data: maxRow } = await sb
        .from("products")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      row.sort_order = Number(maxRow?.sort_order ?? -1) + 1;
    }

    const { data, error } = await sb.from("products").upsert(row).select("*").single();
    if (error) {
      return NextResponse.json(
        { error: error.message, savedCount: saved.length },
        { status: 500 }
      );
    }
    saved.push(data);
    paths.push(`/product/${slug}`);
    await writeAudit(session.admin.id, "product_upsert", "products", id, { name, slug });
  }

  revalidateStorefront(["/admin/products", "/shop", ...paths]);
  if (batch) {
    return NextResponse.json({ products: saved, count: saved.length });
  }
  return NextResponse.json({ product: saved[0] });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const body = await req.json().catch(() => ({} as { ids?: string[] }));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : id ? [id] : [];
  if (!ids.length) return NextResponse.json({ error: "id(s) required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("products").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "product_delete", "products", ids.join(","), {
    count: ids.length,
  });
  revalidateStorefront();
  return NextResponse.json({ ok: true, deleted: ids.length });
}

/**
 * Bulk / single updates: sold out, restock, category, collection, publish, reorder
 * Body: { ids: string[], action: '...', value?: string|number }
 * Reorder: { action: 'reorder', ids: string[], scope?: 'ready-to-wear' | 'all' }
 */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.map((value: unknown) => String(value)).filter(Boolean)
    : [];
  const action = String(body.action || "");
  if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  const sb = createServiceClient();
  const now = new Date().toISOString();

  if (action === "reorder") {
    const scope = String(body.scope || "all");

    if (scope === "ready-to-wear") {
      const { data: allRows, error: allErr } = await sb
        .from("products")
        .select("id, collection_slug, sort_order")
        .order("sort_order")
        .order("id");
      if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });

      const all = allRows ?? [];
      const rtwCurrent = all.filter((p) => p.collection_slug === "ready-to-wear");
      const currentIds = new Set(rtwCurrent.map((p) => String(p.id)));
      if (
        ids.length !== rtwCurrent.length ||
        ids.some((id: string) => !currentIds.has(id))
      ) {
        return NextResponse.json(
          { error: "ids must include every Ready-to-Wear product exactly once" },
          { status: 400 }
        );
      }

      // Preserve non-RTW positions; place reordered RTW into the existing RTW slots.
      // Then assign unique sort_order 0..n-1 so ties never shuffle randomly.
      const queue = ids.slice();
      const newOrder: string[] = [];
      for (const row of all) {
        if (row.collection_slug === "ready-to-wear") {
          newOrder.push(queue.shift()!);
        } else {
          newOrder.push(row.id);
        }
      }

      for (let i = 0; i < newOrder.length; i++) {
        const { error } = await sb
          .from("products")
          .update({ sort_order: i, updated_at: now })
          .eq("id", newOrder[i]);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await writeAudit(
        session.admin.id,
        "product_reorder_rtw",
        "products",
        ids[0] ?? "",
        { count: ids.length, first: ids[0] }
      );
      revalidateStorefront(["/", "/shop", "/admin/products"]);
      return NextResponse.json({
        ok: true,
        updated: ids.length,
        scope: "ready-to-wear",
        coverProductId: ids[0] ?? null,
      });
    }

    // Global catalogue order — unique sort_order per index
    for (let i = 0; i < ids.length; i++) {
      const { error } = await sb
        .from("products")
        .update({ sort_order: i, updated_at: now })
        .eq("id", ids[i]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await writeAudit(session.admin.id, "product_reorder", "products", ids.join(","), {
      count: ids.length,
    });
    revalidateStorefront(["/", "/shop", "/admin/products"]);
    return NextResponse.json({ ok: true, updated: ids.length, scope: "all" });
  }

  let patch: Record<string, unknown> = { updated_at: now };

  if (action === "sold_out") {
    patch = { ...patch, stock: 0 };
  } else if (action === "restock") {
    const qty = Number(body.value ?? 10);
    patch = { ...patch, stock: Number.isFinite(qty) && qty > 0 ? qty : 10 };
  } else if (action === "category") {
    const category = String(body.value || "").trim();
    if (!category) return NextResponse.json({ error: "category value required" }, { status: 400 });
    patch = { ...patch, category_slug: category };
  } else if (action === "collection") {
    const collection = String(body.value || "").trim();
    if (!collection) return NextResponse.json({ error: "collection value required" }, { status: 400 });
    patch = { ...patch, collection_slug: collection };
  } else if (action === "publish") {
    patch = { ...patch, is_published: true };
  } else if (action === "unpublish") {
    patch = { ...patch, is_published: false };
  } else if (action === "stock") {
    const qty = Number(body.value ?? 0);
    patch = { ...patch, stock: Math.max(0, Number.isFinite(qty) ? qty : 0) };
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await sb.from("products").update(patch).in("id", ids).select("id, slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(session.admin.id, `product_bulk_${action}`, "products", ids.join(","), {
    count: ids.length,
    value: body.value ?? null,
  });
  const extra = (data ?? []).map((p) => `/product/${p.slug}`);
  revalidateStorefront(["/admin/products", ...extra]);
  return NextResponse.json({ ok: true, updated: data?.length ?? ids.length });
}
