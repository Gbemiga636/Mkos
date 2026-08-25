import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/client";
import { isMerchantReference } from "@/lib/checkout/payRef";
import { SuccessClient, type OrderPayload } from "../SuccessClient";

export const dynamic = "force-dynamic";

const ORDER_SELECT =
  "id, email, shipping_name, total, currency, payment_status, paid_at, paystack_reference, order_items(*)";

async function loadPaidOrder(reference: string): Promise<OrderPayload | null> {
  if (!reference) return null;
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("orders")
      .select(ORDER_SELECT)
      .eq("paystack_reference", reference)
      .maybeSingle();
    if (data?.payment_status === "paid") return data as OrderPayload;
  } catch {
    /* client will poll verify */
  }
  return null;
}

export default async function CheckoutSuccessByReferencePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference: raw } = await params;
  const reference = decodeURIComponent(raw || "").trim();
  const initialOrder = isMerchantReference(reference) ? await loadPaidOrder(reference) : null;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mkos-warm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-mkos-ink/15 border-t-mkos-accent" />
        </div>
      }
    >
      <SuccessClient pathReference={reference} initialOrder={initialOrder} />
    </Suspense>
  );
}
