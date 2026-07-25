import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import { paystackSecret } from "@/lib/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const secret = paystackSecret();
    if (!secret) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
    }

    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const hash = createHmac("sha512", secret).update(raw).digest("hex");

    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(raw) as {
      event?: string;
      data?: { reference?: string; status?: string; amount?: number; paid_at?: string };
    };

    if (event.event === "charge.success" && event.data?.reference) {
      await fulfillPaidOrder({
        reference: event.data.reference,
        amountKobo: event.data.amount,
        paidAt: event.data.paid_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[paystack webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
