import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import { createServiceClient } from "@/lib/supabase/client";
import {
  flutterwaveGetCharge,
  flutterwaveGetChargeByReference,
  flutterwaveSucceeded,
  type FlutterwaveCharge,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function amountToCents(amount: number | undefined, orderTotal: number) {
  if (amount == null || !Number.isFinite(amount)) {
    return Math.round(orderTotal * 100);
  }
  const asMajor = Math.round(amount * 100);
  const expected = Math.round(orderTotal * 100);
  if (Math.abs(asMajor - expected) <= 2) return asMajor;
  if (Math.abs(Math.round(amount) - expected) <= 2) return Math.round(amount);
  return asMajor;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const chargeId = String(
      body.chargeId || body.transactionId || body.transaction_id || ""
    ).trim();
    if (!reference && !chargeId) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    let payment: FlutterwaveCharge | null = null;
    if (chargeId) {
      try {
        payment = await flutterwaveGetCharge(chargeId);
      } catch {
        /* fall back to reference lookup below */
      }
    }
    if (!payment && reference) {
      payment = await flutterwaveGetChargeByReference(reference);
    }

    const status = payment?.status || "";
    const amount = payment?.amount;
    const resolvedRef = payment?.reference || reference;

    if (!resolvedRef) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const sb = createServiceClient();
    const { data: pending } = await sb
      .from("orders")
      .select("total, currency, payment_status")
      .eq("paystack_reference", resolvedRef)
      .maybeSingle();

    if (!pending) {
      return NextResponse.json(
        { error: "Order not found for this payment reference" },
        { status: 404 }
      );
    }

    if (!flutterwaveSucceeded(status) && pending.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed yet", status: status || "pending" },
        { status: 402 }
      );
    }

    const result = await fulfillPaidOrder({
      reference: resolvedRef,
      amountKobo: amountToCents(amount, Number(pending.total || 0)),
      paidAt: new Date().toISOString(),
    });

    const { data: order } = await sb
      .from("orders")
      .select(
        "id, email, shipping_name, total, currency, payment_status, paid_at, paystack_reference, order_items(*)"
      )
      .eq("paystack_reference", resolvedRef)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      order,
      reference: resolvedRef,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
