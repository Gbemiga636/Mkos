import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { loadPromoCodes, savePromoCodes, type PromoCode } from "@/lib/checkout/promos";
import { revalidateStorefront } from "@/lib/cms/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const codes = await loadPromoCodes();
    return NextResponse.json({ codes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load codes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const codes = (Array.isArray(body.codes) ? body.codes : []) as PromoCode[];
    const saved = await savePromoCodes(codes);
    await writeAudit(session.admin.id, "promos_update", "site_content", "checkout_promos");
    revalidateStorefront();
    return NextResponse.json({ ok: true, codes: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save codes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
