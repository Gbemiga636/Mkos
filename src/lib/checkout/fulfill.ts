import { createServiceClient } from "@/lib/supabase/client";
import type { OrderEmailPayload } from "@/lib/email/orderEmails";
import { sendOrderEmails } from "@/lib/email/send";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export type CheckoutItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

async function decrementStock(
  sb: ReturnType<typeof createServiceClient>,
  productId: string,
  qty: number
) {
  const { data: rpcStock, error: rpcErr } = await sb.rpc("decrement_product_stock", {
    p_id: productId,
    p_qty: qty,
  });

  if (!rpcErr && rpcStock != null) {
    return Number(rpcStock);
  }

  const { data: prod } = await sb
    .from("products")
    .select("id, stock, slug")
    .eq("id", productId)
    .maybeSingle();
  if (!prod) return null;
  const next = Math.max(0, Number(prod.stock ?? 0) - qty);
  await sb
    .from("products")
    .update({ stock: next, updated_at: new Date().toISOString() })
    .eq("id", productId);
  return next;
}

export async function fulfillPaidOrder(opts: {
  reference: string;
  amountKobo?: number;
  paidAt?: string | null;
}) {
  const sb = createServiceClient();
  const { data: order, error } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .eq("paystack_reference", opts.reference)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found for this payment reference");

  if (order.payment_status === "paid") {
    return { order, alreadyPaid: true as const };
  }

  if (opts.amountKobo != null) {
    const expected = Math.round(Number(order.total) * 100);
    if (Math.abs(opts.amountKobo - expected) > 1) {
      throw new Error(
        `Amount mismatch: paid ${opts.amountKobo} kobo, order expects ${expected}`
      );
    }
  }

  const paidAt = opts.paidAt || new Date().toISOString();
  const { error: upErr } = await sb
    .from("orders")
    .update({
      payment_status: "paid",
      status: "paid",
      paid_at: paidAt,
    })
    .eq("id", order.id);

  if (upErr) throw new Error(upErr.message);

  const items = (order.order_items || []) as {
    product_id: string | null;
    slug: string | null;
    name: string;
    quantity: number;
    price: number;
    color: string | null;
    size: string | null;
    image: string | null;
  }[];

  // Auto sold-out: decrement stock; 0 hides buy CTAs on storefront
  const paths: string[] = [];
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (!item.product_id || qty <= 0) continue;
    try {
      await decrementStock(sb, item.product_id, qty);
      if (item.slug) paths.push(`/product/${item.slug}`);
    } catch {
      /* don't block order emails if stock update fails */
    }
  }
  if (paths.length) {
    revalidateStorefront(["/shop", ...paths]);
  }

  const payload: OrderEmailPayload = {
    orderId: order.id,
    reference: order.paystack_reference || opts.reference,
    email: order.email || "",
    customerName: order.shipping_name || "Client",
    phone: order.shipping_phone || order.phone,
    addressLine: order.shipping_address || "",
    city: order.shipping_city || "",
    state: order.shipping_state || "",
    postal: order.shipping_postal || "",
    country: order.shipping_country || "Nigeria",
    items: items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: Number(i.price),
      color: i.color,
      size: i.size,
      image: i.image,
    })),
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    currency: order.currency || "NGN",
    paidAt,
  };

  if (payload.email) {
    await sendOrderEmails(payload);
  }

  try {
    await sb.from("admin_notifications").insert({
      kind: "order",
      title: `Order paid · ${payload.reference}`,
      body: `${payload.customerName} · ₦${payload.total.toLocaleString()} · ${payload.items.length} item(s)`,
    });
  } catch {
    /* optional */
  }

  if (order.user_id) {
    const points = Math.floor(Number(order.total) / 1000);
    if (points > 0) {
      const { data: prof } = await sb
        .from("profiles")
        .select("reward_points")
        .eq("id", order.user_id)
        .maybeSingle();
      await sb
        .from("profiles")
        .update({ reward_points: (prof?.reward_points ?? 0) + points })
        .eq("id", order.user_id);
    }
  }

  return { order: { ...order, payment_status: "paid", paid_at: paidAt }, alreadyPaid: false as const };
}
