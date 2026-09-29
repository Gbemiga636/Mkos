import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { buildMonthlyReport, monthlyReportKey } from "@/lib/reports/monthly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const now = new Date();
    const year = Math.max(2020, Number(url.searchParams.get("year")) || now.getUTCFullYear());
    const month = Math.min(12, Math.max(1, Number(url.searchParams.get("month")) || now.getUTCMonth() + 1));
    const report = await buildMonthlyReport(
      createServiceClient(),
      year,
      month,
      session.admin.full_name || session.admin.email || "MKoS Studio"
    );
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not build report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "year and month required" }, { status: 400 });
    }
    const editable = body.editable || {};
    const sb = createServiceClient();
    const { error } = await sb.from("site_content").upsert(
      {
        key: monthlyReportKey(year, month),
        section: "reports",
        title: `Monthly report ${year}-${String(month).padStart(2, "0")}`,
        extra: editable,
        is_published: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save report notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
