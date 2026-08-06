import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/client";
import { getStripe, siteUrl, stripeConfigured } from "@/lib/stripe";
import { getNgnRates, convertFromNgn } from "@/lib/currency/rates";
import type { CheckoutItem } from "@/lib/checkout/fulfill";
import {
  DELIVERY_FEE_NOTE,
  deliveryMethodLabel,
  isDeliveryMethod,
} from "@/lib/checkout/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toUsdCents(amountUsd: number) {
  return Math.max(50, Math.round(amountUsd * 100));
}

export async function POST(req: Request) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "International Stripe payments are not configured yet. Add STRIPE_SECRET_KEY to the server environment.",
        },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const first = String(body.first || "").trim();
    const last = String(body.last || "").trim();
    const phone = String(body.phone || "").trim();
    const deliveryMethod = body.deliveryMethod;
    const expectedDeliveryDate = String(body.expectedDeliveryDate || "").trim();
    let address = String(body.address || "").trim();
    let city = String(body.city || "").trim();
    let state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    let country = String(body.country || "").trim();
    const userId = body.userId ? String(body.userId) : null;
    const items = (Array.isArray(body.items) ? body.items : []) as CheckoutItem[];

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!first || !last || !phone) {
      return NextResponse.json({ error: "Please complete name and phone" }, { status: 400 });
    }
    if (!isDeliveryMethod(deliveryMethod)) {
      return NextResponse.json({ error: "Please choose a delivery method" }, { status: 400 });
    }
    if (deliveryMethod !== "international") {
      return NextResponse.json(
        { error: "Stripe is for international shipping only. Choose International shipping." },
        { status: 400 }
      );
    }
    if (!expectedDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expectedDeliveryDate)) {
      return NextResponse.json(
        { error: "Please share a valid expected delivery date" },
        { status: 400 }
      );
    }
    if (!address || !city || !country) {
      return NextResponse.json(
        { error: "Please complete delivery address, city, and country" },
        { status: 400 }
      );
    }
    if (/^nigeria$/i.test(country)) {
      return NextResponse.json(
        { error: "Nigeria orders use Paystack. Select Local delivery or change country." },
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
    for (const item of items) {
      if (!item.productId) continue;
      const { data: prod } = await sb
        .from("products")
        .select("id, name, stock, is_published")
        .eq("id", item.productId)
        .maybeSingle();
      if (!prod || prod.is_published === false) {
        return NextResponse.json(
          { error: `${item.name || "An item"} is no longer available` },
          { status: 400 }
        );
      }
      const available = Number(prod.stock ?? 0);
      if (available <= 0) {
        return NextResponse.json({ error: `${prod.name} is sold out` }, { status: 400 });
      }
      if (Number(item.quantity) > available) {
        return NextResponse.json(
          {
            error: `Only ${available} left of ${prod.name} — reduce quantity and try again`,
          },
          { status: 400 }
        );
      }
    }

    const { rates } = await getNgnRates();
    const lineUsd = items.map((item) => {
      const unitUsd =
        item.priceUsd != null && Number(item.priceUsd) > 0
          ? Number(item.priceUsd)
          : convertFromNgn(Number(item.price), "USD", rates);
      return {
        ...item,
        unitUsd,
        lineUsd: unitUsd * Number(item.quantity),
      };
    });
    const subtotalUsd = lineUsd.reduce((n, i) => n + i.lineUsd, 0);
    const totalUsd = subtotalUsd;
    if (totalUsd <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const reference = `mkos_st_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const customerName = `${first} ${last}`.trim();
    const methodLabel = deliveryMethodLabel(deliveryMethod);
    const notes = [
      `Payment: Stripe (international)`,
      `Delivery method: ${methodLabel}`,
      `Expected delivery date: ${expectedDeliveryDate}`,
      DELIVERY_FEE_NOTE,
      "U.S. orders may attract a 17% import duty collected by customs at delivery.",
    ].join("\n");

    const baseOrder = {
      user_id: userId,
      email,
      phone,
      status: "pending_payment",
      payment_status: "pending",
      subtotal: Number(subtotalUsd.toFixed(2)),
      shipping: 0,
      total: Number(totalUsd.toFixed(2)),
      currency: "USD",
      shipping_name: customerName,
      shipping_address: address,
      shipping_city: city,
      shipping_state: state,
      shipping_postal: zip,
      shipping_country: country,
      shipping_phone: phone,
      paystack_reference: reference,
      payment_provider: "stripe",
      notes,
      delivery_method: deliveryMethod,
      expected_delivery_date: expectedDeliveryDate,
    };

    let order: { id: string } | null = null;
    let orderErr: { message: string } | null = null;

    {
      const res = await sb.from("orders").insert(baseOrder).select("id").single();
      order = res.data;
      orderErr = res.error;
    }

    // Fallback if payment_provider column not yet migrated
    if (orderErr && /payment_provider|schema cache/i.test(orderErr.message)) {
      const { payment_provider: _p, ...withoutProvider } = baseOrder;
      const res = await sb.from("orders").insert(withoutProvider).select("id").single();
      order = res.data;
      orderErr = res.error;
    }

    if (orderErr && /delivery_method|expected_delivery_date|schema cache/i.test(orderErr.message)) {
      const legacy = {
        user_id: userId,
        email,
        phone,
        status: "pending_payment",
        payment_status: "pending",
        subtotal: baseOrder.subtotal,
        shipping: 0,
        total: baseOrder.total,
        currency: "USD",
        shipping_name: customerName,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_postal: zip,
        shipping_country: country,
        shipping_phone: phone,
        paystack_reference: reference,
        notes,
      };
      const res = await sb.from("orders").insert(legacy).select("id").single();
      order = res.data;
      orderErr = res.error;
    }

    if (orderErr || !order) {
      return NextResponse.json(
        { error: orderErr?.message || "Could not create order" },
        { status: 500 }
      );
    }

    const { error: itemsErr } = await sb.from("order_items").insert(
      lineUsd.map((item) => ({
        order_id: order!.id,
        product_id: item.productId,
        slug: item.slug,
        name: item.name,
        price: Number(item.unitUsd.toFixed(2)),
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: reference,
      success_url: `${siteUrl()}/checkout/success?reference=${encodeURIComponent(reference)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout?cancelled=1`,
      line_items: lineUsd.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: toUsdCents(item.unitUsd),
          product_data: {
            name: item.name,
            images: item.image ? [item.image.startsWith("http") ? item.image : `${siteUrl()}${item.image}`] : undefined,
            metadata: {
              product_id: item.productId || "",
              size: item.size || "",
              color: item.color || "",
            },
          },
        },
      })),
      metadata: {
        order_id: order.id,
        reference,
        customer_name: customerName,
        phone,
        delivery_method: deliveryMethod,
        expected_delivery_date: expectedDeliveryDate,
        shipping_country: country,
      },
      shipping_address_collection: undefined,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start Stripe Checkout" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      provider: "stripe",
      reference,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
