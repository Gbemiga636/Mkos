import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/client";
import { getNgnRates, convertFromNgn } from "@/lib/currency/rates";
import type { CheckoutItem } from "@/lib/checkout/fulfill";
import {
  DELIVERY_FEE_NOTE,
  STUDIO_PICKUP_ADDRESS,
  deliveryMethodLabel,
  isDeliveryMethod,
} from "@/lib/checkout/delivery";
import { findCountryByName } from "@/lib/checkout/countries";
import { flutterwaveConfigured, flutterwaveCreateCustomer } from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!flutterwaveConfigured()) {
      return NextResponse.json(
        {
          error:
            "Flutterwave is not configured yet. Add FLUTTERWAVE_CLIENT_ID and FLUTTERWAVE_CLIENT_SECRET to the server environment.",
        },
        { status: 503 }
      );
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
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    const country = String(body.country || "").trim();
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
        { error: "Please share a valid expected delivery date" },
        { status: 400 }
      );
    }
    const needsAddress =
      deliveryMethod === "home_delivery" || deliveryMethod === "international";
    if (needsAddress && (!address || !city || !country)) {
      return NextResponse.json(
        { error: "Please complete delivery address, city, and country" },
        { status: 400 }
      );
    }
    if (!items.length) {
      return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.name || !item.quantity) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }
      const hasUsd = item.priceUsd != null && Number(item.priceUsd) > 0;
      const hasNgn = Number(item.price) > 0;
      if (!hasUsd && !hasNgn) {
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

    const reference = `mkosfw${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
    const customerName = `${first} ${last}`.trim();
    const methodLabel = deliveryMethodLabel(deliveryMethod);

    const shippingAddress =
      deliveryMethod === "pickup" ? STUDIO_PICKUP_ADDRESS : address;
    const shippingCity = deliveryMethod === "pickup" ? "Lagos" : city;
    const shippingCountry = deliveryMethod === "pickup" ? "Nigeria" : country;
    const iso = findCountryByName(shippingCountry)?.code || "NG";
    const phoneDial = String(body.phoneDial || "").replace(/\D/g, "");
    let national = String(body.phoneNational || phone)
      .replace(/\D/g, "")
      .replace(/^0+/, "");
    if (phoneDial && national.startsWith(phoneDial)) {
      national = national.slice(phoneDial.length);
    }
    const countryCode = phoneDial || (iso === "NG" ? "234" : "");

    const flwCustomer = await flutterwaveCreateCustomer({
      email,
      first,
      last,
      phone:
        countryCode && national
          ? { country_code: countryCode, number: national }
          : undefined,
      address: {
        city: shippingCity,
        country: iso,
        line1: shippingAddress,
        postal_code: zip,
        state,
      },
    });
    const customerId = flwCustomer.id;
    if (!customerId) {
      return NextResponse.json(
        { error: "Could not create Flutterwave customer" },
        { status: 502 }
      );
    }

    const notes = [
      `Payment: Flutterwave v4 (USD)`,
      `FLW_CUSTOMER:${customerId}`,
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
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: state,
      shipping_postal: zip,
      shipping_country: shippingCountry,
      shipping_phone: phone,
      paystack_reference: reference,
      payment_provider: "flutterwave",
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

    if (orderErr && /payment_provider|schema cache/i.test(orderErr.message)) {
      const withoutProvider = { ...baseOrder };
      delete (withoutProvider as { payment_provider?: string }).payment_provider;
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
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_state: state,
        shipping_postal: zip,
        shipping_country: shippingCountry,
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

    const orderItemRows = lineUsd.map((item) => ({
      order_id: order!.id,
      product_id: item.productId,
      slug: item.slug,
      name: item.name,
      price: Number(item.unitUsd.toFixed(2)),
      image: item.image,
      color: item.color,
      size: item.size,
      sizing_mode: item.sizingMode === "length" ? "length" : "size",
      quantity: item.quantity,
    }));

    let { error: itemsErr } = await sb.from("order_items").insert(orderItemRows);
    if (itemsErr && /sizing_mode|schema cache/i.test(itemsErr.message)) {
      const withoutMode = orderItemRows.map(({ sizing_mode, ...rest }) => {
        void sizing_mode;
        return rest;
      });
      ({ error: itemsErr } = await sb.from("order_items").insert(withoutMode));
    }

    if (itemsErr) {
      await sb.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      provider: "flutterwave",
      reference,
      customerId,
      payOnSite: true,
      amount: Number(totalUsd.toFixed(2)),
      currency: "USD",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Flutterwave checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
