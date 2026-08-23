import { NextResponse } from "next/server";
import { findPromo, loadPromoCodes } from "@/lib/checkout/promos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    if (!code) {
      return NextResponse.json({ error: "Enter a discount code" }, { status: 400 });
    }
    const promo = findPromo(await loadPromoCodes(), code);
    if (!promo) {
      return NextResponse.json({ error: "That code isn’t valid" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      code: promo.code,
      percent: promo.percent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
