import { createServiceClient } from "@/lib/supabase/client";
import type { OrderEmailPayload } from "@/lib/email/orderEmails";
import { sendOrderEmails } from "@/lib/email/send";

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

  // Idempotent — already fulfilled
  if (order.payment_status === "paid") {
    return { order, alreadyPaid: true as const };
  }

  if (opts.amountKobo != null) {
    const expected = Math.round(Number(order.total) * 100);
    // Allow 1 kobo rounding tolerance
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
    name: string;
    quantity: number;
    price: number;
    color: string | null;
    size: string | null;
    image: string | null;
  }[];

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

  // Notify admin inbox in-app
  try {
    await sb.from("admin_notifications").insert({
      kind: "order",
      title: `Order paid · ${payload.reference}`,
      body: `${payload.customerName} · ₦${payload.total.toLocaleString()} · ${payload.items.length} item(s)`,
    });
  } catch {
    /* optional table */
  }

  // Reward points for logged-in customers
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
