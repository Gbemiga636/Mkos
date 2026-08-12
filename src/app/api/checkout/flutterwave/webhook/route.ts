import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import {
  flutterwaveGetCharge,
  flutterwavePaymentSucceeded,
  flutterwaveWebhookSecret,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(rawBody: string, signature: string | null, secret: string) {
  if (!secret || !signature) return !secret;
  const hash = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("flutterwave-signature");
  const secret = flutterwaveWebhookSecret();

  if (secret && !validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      id?: string;
      reference?: string;
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
    const type = String(event.type || "");
    if (type === "charge.completed" || type === "charge.succeeded") {
      const data = event.data || {};
      let status = data.status;
      let amount = data.amount;
      let reference = data.reference;

      if (data.id) {
        try {
          const charge = await flutterwaveGetCharge(data.id);
          status = charge.status || status;
          amount = charge.amount ?? amount;
          reference = charge.reference || reference;
        } catch {
          /* use webhook payload if re-query fails */
        }
      }

      if (reference && flutterwavePaymentSucceeded(status)) {
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
