import { createServiceClient } from "@/lib/supabase/client";

export default async function LivePage() {
  const sb = createServiceClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  let data: { session_id: string; path: string | null; visitor_id: string; last_seen_at: string }[] =
    [];
  try {
    const res = await sb
      .from("analytics_live")
      .select("*")
      .gte("last_seen_at", cutoff)
      .order("last_seen_at", { ascending: false });
    data = res.data ?? [];
  } catch {
    data = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Realtime
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Live visitors</h1>
        <p className="mt-2 text-sm text-mkos-muted">{data.length} active in the last 2 minutes</p>
      </div>
      <div className="space-y-2">
        {data.map((s) => (
          <div
            key={s.session_id}
            className="flex items-center justify-between border border-mkos-border bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm">{s.path || "/"}</p>
                <p className="text-xs text-mkos-muted">{s.visitor_id.slice(0, 12)}…</p>
              </div>
            </div>
            <span className="text-xs text-mkos-muted">
              {new Date(s.last_seen_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {!data.length && (
          <p className="text-sm text-mkos-muted">
            No live users yet. Browse the storefront to populate this feed.
          </p>
        )}
      </div>
    </div>
  );
}
