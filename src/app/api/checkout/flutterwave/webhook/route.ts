import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import {
  flutterwaveGetCharge,
  flutterwaveGetChargeByReference,
  flutterwaveSucceeded,
  flutterwaveWebhookValid,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("flutterwave-signature");
  const hash = req.headers.get("verif-hash");
  const signed = flutterwaveWebhookValid(rawBody, hash, hmac);
  let apiConfirmed = false;

  let event: {
    event?: string;
    type?: string;
    data?: {
      id?: string | number;
      reference?: string;
      tx_ref?: string;
      txRef?: string;
      status?: string;
      amount?: number;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data || {};
  const chargeId = data.id != null ? String(data.id) : "";
  let status = data.status;
  let amount = data.amount;
  let reference = data.reference || data.tx_ref || data.txRef;

  if (!signed && !chargeId && !reference) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (chargeId) {
      try {
        const payment = await flutterwaveGetCharge(chargeId);
        status = payment.status || status;
        amount = payment.amount ?? amount;
        reference = payment.reference || reference;
        apiConfirmed = true;
      } catch {
        /* use payload */
      }
    } else if (reference) {
      const payment = await flutterwaveGetChargeByReference(reference);
      if (payment) {
        status = payment.status || status;
        amount = payment.amount ?? amount;
        reference = payment.reference || reference;
        apiConfirmed = true;
      }
    }

    if (!signed && !apiConfirmed) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (reference && flutterwaveSucceeded(status)) {
      await fulfillPaidOrder({
        reference,
        amountKobo: amount != null ? Math.round(Number(amount) * 100) : undefined,
        paidAt: new Date().toISOString(),
        skipAmountCheck: true,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fulfillment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
