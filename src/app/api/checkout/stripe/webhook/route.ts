import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const rawBody = await req.text();

  let event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Local/dev without webhook secret — parse JSON only (not for production)
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        client_reference_id?: string | null;
        amount_total?: number | null;
        payment_status?: string;
      };
      const reference = session.client_reference_id;
      if (reference && session.payment_status === "paid") {
        await fulfillPaidOrder({
          reference,
          amountKobo: session.amount_total ?? undefined,
          paidAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fulfillment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
