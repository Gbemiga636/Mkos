import { NextResponse } from "next/server";
import { paystackVerify } from "@/lib/paystack";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import { createServiceClient } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    if (!reference) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    const verified = await paystackVerify(reference);
    if (verified.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful yet", status: verified.status },
        { status: 402 }
      );
    }

    const result = await fulfillPaidOrder({
      reference,
      amountKobo: verified.amount,
      paidAt: verified.paid_at || new Date().toISOString(),
    });

    const sb = createServiceClient();
    const { data: order } = await sb
      .from("orders")
      .select("id, email, shipping_name, total, currency, payment_status, paid_at, paystack_reference, order_items(*)")
      .eq("paystack_reference", reference)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      order,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }
  // Reuse POST logic
  const fake = new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  return POST(fake);
}
