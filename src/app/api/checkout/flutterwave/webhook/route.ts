import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import {
  flutterwaveGetCharge,
  flutterwaveSucceeded,
  flutterwaveWebhookValid,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("flutterwave-signature");
  const hash = req.headers.get("verif-hash");

  if (!flutterwaveWebhookValid(rawBody, hash, hmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    type?: string;
    data?: {
      id?: string;
      reference?: string;
      tx_ref?: string;
      status?: string;
      amount?: number;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const type = String(event.type || event.event || "");
    if (type === "charge.completed") {
      const data = event.data || {};
      let status = data.status;
      let amount = data.amount;
      let reference = data.reference || data.tx_ref;

      if (data.id) {
        try {
          const payment = await flutterwaveGetCharge(String(data.id));
          status = payment.status || status;
          amount = payment.amount ?? amount;
          reference = payment.reference || reference;
        } catch {
          /* fall back to webhook payload if re-verify fails */
        }
      }

      if (reference && flutterwaveSucceeded(status)) {
        await fulfillPaidOrder({
          reference,
          amountKobo: amount != null ? Math.round(Number(amount) * 100) : undefined,
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
