import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import { looksLikeChargeId, pickMerchantReference } from "@/lib/checkout/payRef";
import { createServiceClient } from "@/lib/supabase/client";
import {
  flutterwaveGetCharge,
  flutterwaveGetChargeByReference,
  flutterwaveSucceeded,
  type FlutterwaveCharge,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_SELECT =
  "id, email, shipping_name, total, currency, payment_status, paid_at, paystack_reference, notes, order_items(*)";

type OrderRow = Record<string, unknown> & {
  payment_status?: string | null;
  paystack_reference?: string | null;
  notes?: string | null;
};

function publicOrder(order: OrderRow | null) {
  if (!order) return null;
  const { notes: _notes, ...rest } = order;
  void _notes;
  return rest;
}

async function loadOrderByReference(
  sb: ReturnType<typeof createServiceClient>,
  reference: string
) {
  if (!reference) return null;
  const { data } = await sb
    .from("orders")
    .select(ORDER_SELECT)
    .eq("paystack_reference", reference)
    .maybeSingle();
  return (data as OrderRow | null) || null;
}

async function loadOrderByChargeStamp(
  sb: ReturnType<typeof createServiceClient>,
  chargeId: string
) {
  if (!looksLikeChargeId(chargeId)) return null;
  const { data } = await sb
    .from("orders")
    .select(ORDER_SELECT)
    .ilike("notes", `%FLW_CHARGE:${chargeId}%`)
    .maybeSingle();
  return (data as OrderRow | null) || null;
}

function paidResponse(order: OrderRow, reference: string, alreadyPaid = true) {
  return NextResponse.json({
    ok: true,
    alreadyPaid,
    order: publicOrder(order),
    reference: order.paystack_reference || reference,
  });
}

async function verifyFromBody(body: Record<string, unknown>) {
  const merchantRef = pickMerchantReference(String(body.reference || ""));
  const rawChargeId = String(
    body.chargeId ||
      body.chargeId ||
      body.transactionId ||
      body.transaction_id ||
      ""
  ).trim();
  const chargeId = looksLikeChargeId(rawChargeId) ? rawChargeId : "";

  if (!merchantRef && !chargeId) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  const sb = createServiceClient();

  if (merchantRef) {
    const existing = await loadOrderByReference(sb, merchantRef);
    if (existing?.payment_status === "paid") {
      return paidResponse(existing, merchantRef);
    }
  }

  const stamped = chargeId ? await loadOrderByChargeStamp(sb, chargeId) : null;
  if (stamped?.payment_status === "paid") {
    return paidResponse(stamped, merchantRef || String(stamped.paystack_reference || ""));
  }

  let payment: FlutterwaveCharge | null = null;
  if (chargeId) {
    try {
      payment = await flutterwaveGetCharge(chargeId);
    } catch {
      /* fall back to merchant reference */
    }
  }
  if (!payment && merchantRef) {
    payment = await flutterwaveGetChargeByReference(merchantRef);
  }

  const status = payment?.status || "";
  const resolvedRef = pickMerchantReference(
    merchantRef,
    stamped?.paystack_reference,
    payment?.reference
  );

  if (!resolvedRef) {
    return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
  }

  const pending = await loadOrderByReference(sb, resolvedRef);
  if (!pending) {
    return NextResponse.json(
      { error: "Order not found for this payment reference" },
      { status: 404 }
    );
  }

  if (pending.payment_status === "paid") {
    return paidResponse(pending, resolvedRef);
  }

  if (!flutterwaveSucceeded(status)) {
    return NextResponse.json(
      { error: "Payment not completed yet", status: status || "pending" },
      { status: 402 }
    );
  }

  const result = await fulfillPaidOrder({
    reference: resolvedRef,
    paidAt: new Date().toISOString(),
    skipAmountCheck: true,
  });

  const order = await loadOrderByReference(sb, resolvedRef);

  return NextResponse.json({
    ok: true,
    alreadyPaid: result.alreadyPaid,
    order: publicOrder(order),
    reference: resolvedRef,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return await verifyFromBody(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    return await verifyFromBody({
      reference: url.searchParams.get("reference") || "",
      chargeId:
        url.searchParams.get("chargeId") ||
        url.searchParams.get("chargeId") ||
        "",
      transactionId: url.searchParams.get("transaction_id") || "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
