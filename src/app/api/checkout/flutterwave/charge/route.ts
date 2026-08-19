import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/siteUrl";
import {
  flutterwaveAuthorizeCharge,
  flutterwaveConfigured,
  flutterwaveCreateCharge,
  flutterwaveCreatePaymentMethod,
  flutterwaveGetCharge,
  flutterwaveNextActionType,
  flutterwaveRedirectUrl,
  flutterwaveSucceeded,
  type EncryptedCard,
  type FlutterwaveCharge,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function customerIdFromNotes(notes: string | null | undefined) {
  const m = String(notes || "").match(/FLW_CUSTOMER:([A-Za-z0-9_-]+)/);
  return m?.[1] || "";
}

function chargeResponse(charge: FlutterwaveCharge) {
  const next = flutterwaveNextActionType(charge);
  return {
    ok: true,
    chargeId: charge.id,
    status: charge.status,
    reference: charge.reference,
    nextAction: next || null,
    redirectUrl: flutterwaveRedirectUrl(charge) || null,
    succeeded: flutterwaveSucceeded(charge.status),
  };
}

export async function POST(req: Request) {
  try {
    if (!flutterwaveConfigured()) {
      return NextResponse.json(
        { error: "Flutterwave is not configured yet." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const chargeId = String(body.chargeId || "").trim();
    const action = String(body.action || "charge").toLowerCase();

    if (action === "status" && chargeId) {
      const charge = await flutterwaveGetCharge(chargeId);
      return NextResponse.json(chargeResponse(charge));
    }

    if (action === "authorize" && chargeId) {
      const kind = String(body.kind || body.type || "").toLowerCase();
      let authorization: Record<string, unknown>;
      if (kind === "pin") {
        const nonce = String(body.nonce || "");
        const encrypted_pin = String(body.encrypted_pin || body.encryptedPin || "");
        if (!nonce || !encrypted_pin) {
          return NextResponse.json({ error: "PIN is required" }, { status: 400 });
        }
        authorization = {
          type: "pin",
          pin: { nonce, encrypted_pin },
        };
      } else if (kind === "otp") {
        const otp = String(body.otp || "").trim();
        const nonce = String(body.nonce || "");
        const encrypted_otp = String(body.encrypted_otp || body.encryptedOtp || "");
        if (nonce && encrypted_otp) {
          authorization = { type: "otp", otp: { nonce, encrypted_otp } };
        } else if (otp) {
          authorization = { type: "otp", otp };
        } else {
          return NextResponse.json({ error: "OTP is required" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Unknown authorization type" }, { status: 400 });
      }
      const charge = await flutterwaveAuthorizeCharge(chargeId, authorization);
      return NextResponse.json(chargeResponse(charge));
    }

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    const card = body.card as EncryptedCard | undefined;
    if (
      !card?.nonce ||
      !card.encrypted_card_number ||
      !card.encrypted_expiry_month ||
      !card.encrypted_expiry_year ||
      !card.encrypted_cvv
    ) {
      return NextResponse.json({ error: "Encrypted card details are required" }, { status: 400 });
    }

    const sb = createServiceClient();
    const { data: order } = await sb
      .from("orders")
      .select("id, total, currency, payment_status, notes")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found for this payment" }, { status: 404 });
    }
    if (String(order.payment_status || "") === "paid") {
      return NextResponse.json({
        ok: true,
        succeeded: true,
        status: "succeeded",
        reference,
        chargeId: null,
        nextAction: null,
        redirectUrl: null,
      });
    }

    const customerId =
      String(body.customerId || "").trim() || customerIdFromNotes(order.notes);
    if (!customerId) {
      return NextResponse.json(
        { error: "Missing Flutterwave customer. Please restart checkout." },
        { status: 400 }
      );
    }

    const { id: paymentMethodId } = await flutterwaveCreatePaymentMethod({
      nonce: String(card.nonce),
      encrypted_card_number: String(card.encrypted_card_number),
      encrypted_expiry_month: String(card.encrypted_expiry_month),
      encrypted_expiry_year: String(card.encrypted_expiry_year),
      encrypted_cvv: String(card.encrypted_cvv),
    });

    const charge = await flutterwaveCreateCharge({
      reference,
      amount: Number(order.total),
      currency: String(order.currency || "USD"),
      customerId,
      paymentMethodId,
      redirectUrl: `${siteUrl()}/checkout/success?reference=${encodeURIComponent(reference)}`,
      meta: { order_id: order.id, reference },
    });

    return NextResponse.json(chargeResponse(charge));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
