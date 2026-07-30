import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function GET(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("newsletter_subscribers")
    .select("id, email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        subscribers: [],
        hint: /does not exist|schema cache/i.test(error.message)
          ? "Run migration 013_newsletter_subscribers.sql in Supabase."
          : undefined,
      },
      { status: /does not exist|schema cache/i.test(error.message) ? 200 : 500 }
    );
  }

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const rows = data ?? [];
    const lines = [
      "email,source,subscribed_at",
      ...rows.map((r) => {
        const email = `"${String(r.email).replace(/"/g, '""')}"`;
        const source = `"${String(r.source || "").replace(/"/g, '""')}"`;
        const at = `"${String(r.created_at || "")}"`;
        return `${email},${source},${at}`;
      }),
    ];
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mkos-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ subscribers: data ?? [] });
}

export async function DELETE(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createServiceClient();
  const { error } = await sb.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
