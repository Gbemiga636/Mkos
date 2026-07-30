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
    // /bank is too permissive — use balance + a dry initialize probe for real payment auth.
    const balanceRes = await fetch("https://api.paystack.co/balance", {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const balanceData = (await balanceRes.json()) as { status?: boolean; message?: string };

    if (balanceData.status === true) {
      return NextResponse.json({
        ...result,
        paystackOk: true,
        paystackMessage: balanceData.message || "Balance retrieved",
        httpStatus: balanceRes.status,
        check: "balance",
      });
    }

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "paystack-status@mykindofstyle.com",
        amount: 10000,
        currency: "NGN",
        reference: `mkos_status_${Date.now()}`,
      }),
      cache: "no-store",
    });
    const initData = (await initRes.json()) as { status?: boolean; message?: string };

    return NextResponse.json(
      {
        ...result,
        paystackOk: initData.status === true,
        paystackMessage: initData.message || balanceData.message || null,
        httpStatus: initRes.status,
        check: "initialize",
        balanceMessage: balanceData.message || null,
        hint:
          initData.status === true
            ? null
            : "This secret key is rejected for payments. In Paystack → Settings → API Keys & Webhooks, copy a fresh Secret Key (sk_test_…) and update PAYSTACK_SECRET_KEY in Netlify, then Clear cache and redeploy.",
      },
      { status: initData.status === true ? 200 : 502 }
    );
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
