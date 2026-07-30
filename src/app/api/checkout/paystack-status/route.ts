import { NextResponse } from "next/server";
import { paystackPublicKey, paystackSecret } from "@/lib/paystack";

/**
 * Safe Paystack env diagnostic for production debugging.
 * Never returns the raw keys.
 */
export async function GET() {
  const secret = paystackSecret();
  const pub = paystackPublicKey();

  const result: Record<string, unknown> = {
    secretPresent: Boolean(secret),
    secretPrefix: secret ? secret.slice(0, 8) : null,
    secretLength: secret.length,
    secretLooksValid: secret.startsWith("sk_test_") || secret.startsWith("sk_live_"),
    publicPresent: Boolean(pub),
    publicPrefix: pub ? pub.slice(0, 8) : null,
    publicLength: pub.length,
    publicLooksValid: pub.startsWith("pk_test_") || pub.startsWith("pk_live_"),
    modeMatch:
      !secret || !pub
        ? null
        : (secret.includes("_test_") && pub.includes("_test_")) ||
          (secret.includes("_live_") && pub.includes("_live_")),
    note: "Checkout uses PAYSTACK_SECRET_KEY only (redirect flow). Public key is optional here.",
  };

  if (!secret) {
    return NextResponse.json(
      { ...result, paystackOk: false, message: "PAYSTACK_SECRET_KEY missing on server" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=1", {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { status?: boolean; message?: string };
    return NextResponse.json({
      ...result,
      paystackOk: data.status === true,
      paystackMessage: data.message || null,
      httpStatus: res.status,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ...result,
        paystackOk: false,
        message: err instanceof Error ? err.message : "Paystack request failed",
      },
      { status: 502 }
    );
  }
}
