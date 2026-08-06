import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirm a Stripe Checkout session and fulfill the order (success-page fallback). */
export async function POST(req: Request) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

    const body = await req.json();
    const sessionId = String(body.sessionId || "").trim();
    const reference = String(body.reference || "").trim();
    if (!sessionId && !reference) {
      return NextResponse.json({ error: "sessionId or reference required" }, { status: 400 });
    }

    let session: Stripe.Checkout.Session | null = sessionId
      ? await stripe.checkout.sessions.retrieve(sessionId)
      : null;

    if (!session && reference) {
      const list = await stripe.checkout.sessions.list({ limit: 20 });
      session = list.data.find((s) => s.client_reference_id === reference) ?? null;
    }

    if (!session) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed", status: session.payment_status }, { status: 402 });
    }

    const ref = session.client_reference_id || reference;
    if (!ref) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const result = await fulfillPaidOrder({
      reference: ref,
      amountKobo: session.amount_total ?? undefined,
      paidAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, alreadyPaid: result.alreadyPaid, reference: ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
