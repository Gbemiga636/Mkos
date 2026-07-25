import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/client";
import { paystackInitialize, siteUrl } from "@/lib/paystack";
import type { CheckoutItem } from "@/lib/checkout/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const first = String(body.first || "").trim();
    const last = String(body.last || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    const country = String(body.country || "Nigeria").trim();
    const userId = body.userId ? String(body.userId) : null;
    const items = (Array.isArray(body.items) ? body.items : []) as CheckoutItem[];

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!first || !last || !address || !city || !phone) {
      return NextResponse.json(
        { error: "Please complete name, phone, address, and city" },
        { status: 400 }
      );
    }
    if (!items.length) {
      return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.name || !item.quantity || item.price == null) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }
      if (Number(item.price) <= 0) {
        return NextResponse.json(
          { error: `${item.name} is price-on-request — contact the studio to order.` },
          { status: 400 }
        );
      }
    }

    const sb = createServiceClient();

    // Prefer live CMS shipping settings
    const { data: settings } = await sb
      .from("site_settings")
      .select("currency, free_shipping_threshold, shipping_fee")
      .eq("id", "main")
      .maybeSingle();

    const currency = settings?.currency || "NGN";
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 300000);
    const shippingFee = Number(settings?.shipping_fee ?? 28000);
    const subtotal = items.reduce((n, i) => n + Number(i.price) * Number(i.quantity), 0);
    const shipping = subtotal >= freeThreshold || subtotal === 0 ? 0 : shippingFee;
    const total = subtotal + shipping;

    if (total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const reference = `mkos_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const customerName = `${first} ${last}`.trim();

    const { data: order, error: orderErr } = await sb
      .from("orders")
      .insert({
        user_id: userId,
        email,
        phone,
        status: "pending_payment",
        payment_status: "pending",
        subtotal,
        shipping,
        total,
        currency,
        shipping_name: customerName,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_postal: zip,
        shipping_country: country,
        shipping_phone: phone,
        paystack_reference: reference,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: orderErr?.message || "Could not create order" },
        { status: 500 }
      );
    }

    const { error: itemsErr } = await sb.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price,
        image: item.image,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      }))
    );

    if (itemsErr) {
      await sb.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    const callbackUrl = `${siteUrl()}/checkout/success?reference=${encodeURIComponent(reference)}`;

    const paystack = await paystackInitialize({
      email,
      amountNaira: total,
      reference,
      callbackUrl,
      metadata: {
        order_id: order.id,
        customer_name: customerName,
        phone,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      reference,
      authorization_url: paystack.authorization_url,
      access_code: paystack.access_code,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
