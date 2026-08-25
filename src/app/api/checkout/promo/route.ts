import { NextResponse } from "next/server";
import { findPromo, loadPromoCodes } from "@/lib/checkout/promos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    const itemCount = Math.max(0, Math.floor(Number(body.itemCount) || 0));
    if (!code) {
      return NextResponse.json({ error: "Enter a discount code" }, { status: 400 });
    }
    const promo = findPromo(await loadPromoCodes(), code);
    if (!promo) {
      return NextResponse.json({ error: "That code isn’t valid" }, { status: 404 });
    }
    if (itemCount < promo.minItems) {
      return NextResponse.json(
        {
          error:
            promo.minItems <= 1
              ? "Add an item to your bag to use this code"
              : `This code is for ${promo.minItems} or more items`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      code: promo.code,
      amountOff: promo.amountOff,
      minItems: promo.minItems,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
