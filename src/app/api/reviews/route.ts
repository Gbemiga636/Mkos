import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const slug = searchParams.get("slug");
  if (!productId && !slug) {
    return NextResponse.json({ error: "productId or slug required" }, { status: 400 });
  }

  const sb = createServiceClient();
  let q = sb
    .from("product_reviews")
    .select("id, product_id, product_slug, name, rating, text, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (productId) q = q.eq("product_id", productId);
  else if (slug) q = q.eq("product_slug", slug);

  const { data, error } = await q;
  if (error) {
    // Table may not exist yet
    return NextResponse.json({ reviews: [], error: error.message });
  }
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const productId = String(body.productId || "").trim();
    const productSlug = String(body.productSlug || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const rating = Number(body.rating);
    const text = String(body.text || "").trim();

    if (!reference) {
      return NextResponse.json({ error: "Order reference required" }, { status: 400 });
    }
    if (!productId && !productSlug) {
      return NextResponse.json({ error: "Product required" }, { status: 400 });
    }
    if (!name || !email.includes("@")) {
      return NextResponse.json({ error: "Name and valid email required" }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }
    if (text.length < 8) {
      return NextResponse.json({ error: "Please share a little more in your review" }, { status: 400 });
    }

    const sb = createServiceClient();
    const { data: order, error: orderErr } = await sb
      .from("orders")
      .select("id, email, payment_status, paystack_reference, order_items(product_id, slug, name)")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found for this reference" }, { status: 404 });
    }
    if (order.payment_status !== "paid") {
      return NextResponse.json({ error: "Reviews open after a confirmed paid order" }, { status: 403 });
    }

    const items = (order.order_items || []) as { product_id: string | null; slug: string | null }[];
    const allowed = items.some(
      (i) =>
        (productId && i.product_id === productId) ||
        (productSlug && i.slug === productSlug)
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "That product was not on this order" },
        { status: 403 }
      );
    }

    const { data, error } = await sb
      .from("product_reviews")
      .insert({
        product_id: productId || null,
        product_slug: productSlug || null,
        order_id: order.id,
        order_reference: reference,
        name,
        email: email || order.email,
        rating: Math.round(rating),
        text,
        is_published: true,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message.includes("product_reviews")
              ? "Reviews table is not ready yet — run migration 015 in Supabase, then try again."
              : error.message,
        },
        { status: 500 }
      );
    }

    if (productSlug) revalidateStorefront([`/product/${productSlug}`]);
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
