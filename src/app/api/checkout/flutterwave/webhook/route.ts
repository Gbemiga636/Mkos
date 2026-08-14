import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import {
  flutterwaveV3Succeeded,
  flutterwaveV3Verify,
  flutterwaveV3WebhookHash,
} from "@/lib/flutterwaveV3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = flutterwaveV3WebhookHash();
  const signature = req.headers.get("verif-hash");

  if (secret && signature !== secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      id?: number | string;
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
    const type = String(event.event || "");
    if (type === "charge.completed") {
      const data = event.data || {};
      let status = data.status;
      let amount = data.amount;
      let reference = data.tx_ref;

      if (data.id) {
        try {
          const payment = await flutterwaveV3Verify(data.id);
          status = payment.status || status;
          amount = payment.amount ?? amount;
          reference = payment.tx_ref || reference;
        } catch {
          /* fall back to webhook payload if re-verify fails */
        }
      }

      if (reference && flutterwaveV3Succeeded(status)) {
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
