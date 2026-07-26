import { createServiceClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/cms/types";
import { deliveryMethodLabel } from "@/lib/checkout/delivery";

export default async function OrdersPage() {
  const sb = createServiceClient();
  const { data: orders } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Commerce
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Orders
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mkos-muted">
          Product totals are paid at checkout. Delivery fees are quoted separately by location.
        </p>
      </div>
      <div className="overflow-hidden border border-mkos-border bg-white">
        <div className="grid grid-cols-[1fr_0.9fr_0.7fr_0.5fr_0.5fr] gap-2 border-b border-mkos-border bg-mkos-warm/60 px-4 py-3 font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
          <span>Order</span>
          <span>Customer</span>
          <span>Delivery</span>
          <span>Status</span>
          <span>Total</span>
        </div>
        {(orders ?? []).map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-[1fr_0.9fr_0.7fr_0.5fr_0.5fr] gap-2 border-b border-mkos-border px-4 py-3 text-sm text-mkos-ink"
          >
            <div>
              <p className="font-medium">{o.paystack_reference || `${o.id.slice(0, 8)}…`}</p>
              <p className="text-xs text-mkos-muted">
                {new Date(o.created_at).toLocaleString()} · {(o.order_items ?? []).length} items
              </p>
            </div>
            <div>
              <p className="text-mkos-ink">{o.shipping_name || "—"}</p>
              <p className="text-xs text-mkos-muted">{o.email || o.phone || ""}</p>
            </div>
            <div className="text-xs text-mkos-muted">
              <p className="text-mkos-ink">{deliveryMethodLabel(o.delivery_method)}</p>
              {o.expected_delivery_date ? (
                <p>Expected {o.expected_delivery_date}</p>
              ) : null}
              {o.shipping_city ? <p>{o.shipping_city}</p> : null}
            </div>
            <span className="capitalize text-mkos-accent">{o.status}</span>
            <span className="tabular-nums">{formatPrice(Number(o.total))}</span>
          </div>
        ))}
        {!orders?.length && (
          <p className="p-6 text-sm text-mkos-muted">
            No orders yet. They appear here as customers checkout.
          </p>
        )}
      </div>
    </div>
  );
}
