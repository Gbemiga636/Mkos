import { createServiceClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/cms/types";

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
      </div>
      <div className="overflow-hidden border border-mkos-border bg-white">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-mkos-border bg-mkos-warm/60 px-4 py-3 font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
          <span>Order</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Total</span>
        </div>
        {(orders ?? []).map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-mkos-border px-4 py-3 text-sm text-mkos-ink"
          >
            <div>
              <p className="font-medium">{o.id.slice(0, 8)}…</p>
              <p className="text-xs text-mkos-muted">
                {new Date(o.created_at).toLocaleString()} · {(o.order_items ?? []).length} items
              </p>
            </div>
            <span className="text-mkos-muted">{o.shipping_name || "—"}</span>
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
