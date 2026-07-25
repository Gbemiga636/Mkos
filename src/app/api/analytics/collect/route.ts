import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { getSessionAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingEvent = {
  type: string;
  path?: string;
  label?: string;
  productId?: string;
  productSlug?: string;
  value?: number;
  meta?: Record<string, unknown>;
};

async function purgeVisitor(
  sb: ReturnType<typeof createServiceClient>,
  visitorId: string,
  sessionId?: string
) {
  if (sessionId) {
    await sb.from("analytics_live").delete().eq("session_id", sessionId);
  }
  await sb.from("analytics_live").delete().eq("visitor_id", visitorId);
  await sb.from("analytics_events").delete().eq("visitor_id", visitorId);
  await sb.from("analytics_sessions").delete().eq("visitor_id", visitorId);
  await sb.from("analytics_visitors").delete().eq("visitor_id", visitorId);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const visitorId = String(body.visitorId ?? "").slice(0, 80);
    const sessionId = String(body.sessionId ?? "").slice(0, 80);
    if (!visitorId || !sessionId) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    const admin = await getSessionAdmin();
    if (admin) {
      try {
        const sb = createServiceClient();
        await purgeVisitor(sb, visitorId, sessionId);
      } catch {
        /* ignore */
      }
      return NextResponse.json({ ok: true, skipped: true, reason: "admin" });
    }

    const events = (Array.isArray(body.events) ? body.events : []) as IncomingEvent[];
    const path = String(body.path ?? events[0]?.path ?? "/");
    if (path.startsWith("/admin")) {
      return NextResponse.json({ ok: true, skipped: true, reason: "admin_path" });
    }

    const sb = createServiceClient();
    const now = new Date().toISOString();
    const heartbeat = Boolean(body.heartbeat);
    const pageViews = events.filter((e) => e.type === "page_view").length;

    // Visitor upsert (2 ops → still needed without RPC; keep lean)
    const { data: existing } = await sb
      .from("analytics_visitors")
      .select("id")
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (existing) {
      await sb
        .from("analytics_visitors")
        .update({
          last_seen_at: now,
          is_returning: true,
          device: body.device ?? null,
          browser: body.browser ?? null,
          os: body.os ?? null,
        })
        .eq("visitor_id", visitorId);
    } else {
      await sb.from("analytics_visitors").insert({
        visitor_id: visitorId,
        device: body.device ?? null,
        browser: body.browser ?? null,
        os: body.os ?? null,
      });
    }

    const { data: sess } = await sb
      .from("analytics_sessions")
      .select("id, page_count")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (sess) {
      await sb
        .from("analytics_sessions")
        .update({
          last_seen_at: now,
          page_count: (sess.page_count ?? 0) + pageViews,
          bounce: false,
          duration_ms: Number(body.durationMs ?? 0),
        })
        .eq("session_id", sessionId);
    } else {
      await sb.from("analytics_sessions").insert({
        session_id: sessionId,
        visitor_id: visitorId,
        landed_path: path,
        referrer: body.referrer ?? null,
        utm_source: body.utmSource ?? null,
        device: body.device ?? null,
        browser: body.browser ?? null,
        os: body.os ?? null,
        page_count: pageViews || 1,
      });
    }

    const rows = events.slice(0, 8).map((e) => ({
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: String(e.type || "custom").slice(0, 64),
      path: e.path ?? body.path ?? null,
      label: e.label ?? null,
      product_id: e.productId ?? null,
      product_slug: e.productSlug ?? null,
      value: e.value ?? null,
      meta: e.meta ?? {},
      occurred_at: now,
    }));

    if (rows.length) {
      await sb.from("analytics_events").insert(rows);
    }

    // Live presence only on heartbeat (~1/min) — not every batch
    if (heartbeat) {
      await sb.from("analytics_live").upsert({
        session_id: sessionId,
        visitor_id: visitorId,
        path,
        last_seen_at: now,
        meta: { device: body.device, browser: body.browser },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Fail soft — never crash the storefront for analytics
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "track failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = String(body.visitorId ?? "").slice(0, 80);
    const sessionId = String(body.sessionId ?? "").slice(0, 80);
    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }
    const sb = createServiceClient();
    await purgeVisitor(sb, visitorId, sessionId || undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "purge failed" },
      { status: 500 }
    );
  }
}
