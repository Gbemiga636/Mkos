import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/siteUrl";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill";
import {
  flutterwaveAuthorizeCharge,
  flutterwaveCreateCardPaymentMethod,
  flutterwaveCreateCharge,
  flutterwaveCreateCustomer,
  flutterwaveGetCharge,
  flutterwavePaymentSucceeded,
  flutterwaveConfigured,
  isUsableHostedCheckoutUrl,
  type FlutterwaveCharge,
} from "@/lib/flutterwave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function digits(value: string, max: number) {
  return String(value || "").replace(/\D/g, "").slice(0, max);
}

function customerIdFromNotes(notes: string | null | undefined) {
  const match = String(notes || "").match(/Flutterwave customer:\s*(cus_[A-Za-z0-9]+)/i);
  return match?.[1] || null;
}

function nextActionPayload(charge: FlutterwaveCharge) {
  const action = charge.next_action;
  const type = String(action?.type || "").toLowerCase();
  const authType = String(action?.authorization?.type || type).toLowerCase();
  const redirect = action?.redirect_url?.url;

  if (flutterwavePaymentSucceeded(charge.status)) {
    return { done: true as const };
  }

  if (type === "redirect_url" && redirect) {
    if (!isUsableHostedCheckoutUrl(redirect)) {
      return {
        error:
          "Flutterwave’s test authorization page is down. Use a no-auth test card, or try again later.",
      };
    }
    return { redirect };
  }

  if (authType.includes("pin") || type.includes("pin")) {
    return { requires: "pin" as const, chargeId: charge.id };
  }
  if (authType.includes("otp") || type.includes("otp")) {
    return { requires: "otp" as const, chargeId: charge.id };
  }

  if (String(charge.status || "").toLowerCase() === "pending") {
    return { requires: "pending" as const, chargeId: charge.id };
  }

  return { error: `Payment is ${charge.status || "pending"}. Please try again.` };
}

async function fulfillIfPaid(charge: FlutterwaveCharge, expectedTotal: number) {
  if (!flutterwavePaymentSucceeded(charge.status) || !charge.reference) return null;
  const amountKobo =
    charge.amount != null ? Math.round(Number(charge.amount) * 100) : Math.round(expectedTotal * 100);
  return fulfillPaidOrder({
    reference: charge.reference,
    amountKobo,
    paidAt: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    if (!flutterwaveConfigured()) {
      return NextResponse.json(
        {
          error:
            "Flutterwave is not configured on the server. Add FLUTTERWAVE_CLIENT_ID and FLUTTERWAVE_CLIENT_SECRET in Netlify, then redeploy.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const chargeId = String(body.chargeId || "").trim();
    const pin = digits(String(body.pin || ""), 6);
    const otp = digits(String(body.otp || ""), 8);

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const sb = createServiceClient();
    const { data: order } = await sb
      .from("orders")
      .select("id, email, phone, shipping_name, total, payment_status, notes")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found for this payment" }, { status: 404 });
    }
    if (order.payment_status === "paid") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        redirect: `/checkout/success?reference=${encodeURIComponent(reference)}`,
      });
    }

    let charge: FlutterwaveCharge;

    if (chargeId && (pin || otp)) {
      charge = await flutterwaveAuthorizeCharge(
        chargeId,
        pin ? { type: "pin", pin } : { type: "otp", otp }
      );
    } else if (chargeId && body.poll) {
      charge = await flutterwaveGetCharge(chargeId);
    } else {
      const encrypted = body.encrypted as
        | {
            nonce?: string;
            encrypted_card_number?: string;
            encrypted_expiry_month?: string;
            encrypted_expiry_year?: string;
            encrypted_cvv?: string;
          }
        | undefined;

      const hasEncrypted =
        encrypted?.nonce &&
        encrypted.encrypted_card_number &&
        encrypted.encrypted_expiry_month &&
        encrypted.encrypted_expiry_year &&
        encrypted.encrypted_cvv;

      const cardNumber = digits(String(body.cardNumber || ""), 19);
      const expiryMonth = digits(String(body.expiryMonth || ""), 2).padStart(2, "0");
      let expiryYear = digits(String(body.expiryYear || ""), 4);
      if (expiryYear.length === 4) expiryYear = expiryYear.slice(-2);
      const cvv = digits(String(body.cvv || ""), 4);

      if (!hasEncrypted && (cardNumber.length < 13 || !expiryMonth || expiryYear.length !== 2 || cvv.length < 3)) {
        return NextResponse.json({ error: "Please enter a valid card" }, { status: 400 });
      }

      const names = String(order.shipping_name || "Client MKoS").trim().split(/\s+/);
      const customerId =
        customerIdFromNotes(order.notes) ||
        (
          await flutterwaveCreateCustomer({
            email: order.email,
            first: names[0] || "Client",
            last: names.slice(1).join(" ") || "MKoS",
            phone: order.phone || undefined,
          })
        ).id;

      const paymentMethodId = hasEncrypted
        ? await flutterwaveCreateCardPaymentMethod({
            nonce: String(encrypted!.nonce),
            encrypted_card_number: String(encrypted!.encrypted_card_number),
            encrypted_expiry_month: String(encrypted!.encrypted_expiry_month),
            encrypted_expiry_year: String(encrypted!.encrypted_expiry_year),
            encrypted_cvv: String(encrypted!.encrypted_cvv),
          })
        : await flutterwaveCreateCardPaymentMethod({
            cardNumber,
            expiryMonth,
            expiryYear,
            cvv,
          });

      charge = await flutterwaveCreateCharge({
        amountUsd: Number(order.total),
        reference,
        customerId,
        paymentMethodId,
        redirectUrl: `${siteUrl()}/checkout/success?reference=${encodeURIComponent(reference)}`,
      });
    }

    const paid = await fulfillIfPaid(charge, Number(order.total || 0));
    if (paid || flutterwavePaymentSucceeded(charge.status)) {
      return NextResponse.json({
        ok: true,
        chargeId: charge.id,
        redirect: `/checkout/success?reference=${encodeURIComponent(reference)}`,
      });
    }

    const next = nextActionPayload(charge);
    if ("error" in next && next.error) {
      return NextResponse.json({ error: next.error, chargeId: charge.id }, { status: 402 });
    }
    if ("redirect" in next && next.redirect) {
      return NextResponse.json({ ok: true, redirect: next.redirect, chargeId: charge.id });
    }

    return NextResponse.json({
      ok: true,
      chargeId: charge.id,
      requires: next.requires,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
