import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/client";
import { paystackInitialize, siteUrl } from "@/lib/paystack";
import type { CheckoutItem } from "@/lib/checkout/fulfill";
import {
  DELIVERY_FEE_NOTE,
  STUDIO_PICKUP_ADDRESS,
  deliveryMethodLabel,
  isDeliveryMethod,
} from "@/lib/checkout/delivery";

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
    if (!expectedDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expectedDeliveryDate)) {
      return NextResponse.json(
        { error: "Please share a valid expected delivery / pickup date" },
        { status: 400 }
      );
    }

    if (deliveryMethod === "pickup") {
      address = STUDIO_PICKUP_ADDRESS;
      city = city || "Lagos";
      state = state || "Lagos";
      country = country || "Nigeria";
    } else if (!address || !city || !country) {
      return NextResponse.json(
        { error: "Please complete delivery address, city, and country" },
        { status: 400 }
      );
    }

    if (deliveryMethod === "international" || !/^nigeria$/i.test(country)) {
      return NextResponse.json(
        {
          error:
            "International orders are paid with Stripe. Choose International shipping and continue to Pay with Stripe.",
        },
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

    const { data: settings } = await sb
      .from("site_settings")
      .select("currency")
      .eq("id", "main")
      .maybeSingle();

    const currency = settings?.currency || "NGN";
    // Delivery is never included in the product checkout total
    const subtotal = items.reduce((n, i) => n + Number(i.price) * Number(i.quantity), 0);
    const shipping = 0;
    const total = subtotal;

    if (total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const reference = `mkos_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const customerName = `${first} ${last}`.trim();
    const methodLabel = deliveryMethodLabel(deliveryMethod);
    const notes = [
      `Delivery method: ${methodLabel}`,
      `Expected delivery date: ${expectedDeliveryDate}`,
      DELIVERY_FEE_NOTE,
    ].join("\n");

    const baseOrder = {
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

    if (orderErr && /delivery_method|expected_delivery_date|schema cache/i.test(orderErr.message)) {
      const legacy = {
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

    const orderItemRows = items.map((item) => ({
      order_id: order!.id,
      product_id: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      image: item.image,
      color: item.color,
      size: item.size,
      sizing_mode: item.sizingMode === "length" ? "length" : "size",
      quantity: item.quantity,
    }));

    let { error: itemsErr } = await sb.from("order_items").insert(orderItemRows);
    if (itemsErr && /sizing_mode|schema cache/i.test(itemsErr.message)) {
      const withoutMode = orderItemRows.map(({ sizing_mode: _m, ...rest }) => rest);
      ({ error: itemsErr } = await sb.from("order_items").insert(withoutMode));
    }

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
        delivery_method: deliveryMethod,
        expected_delivery_date: expectedDeliveryDate,
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
