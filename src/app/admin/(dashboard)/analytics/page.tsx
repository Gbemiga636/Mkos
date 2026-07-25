import { createServiceClient } from "@/lib/supabase/client";
import { AnalyticsClient } from "@/components/admin/AnalyticsClient";

export default async function AnalyticsPage() {
  const sb = createServiceClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  let events: { event_type: string; path: string | null; occurred_at: string; label: string | null }[] = [];
  let sessions: { device: string | null; browser: string | null; utm_source: string | null; started_at: string }[] = [];
  try {
    const [e, s] = await Promise.all([
      sb
        .from("analytics_events")
        .select("event_type, path, occurred_at, label")
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(2000),
      sb.from("analytics_sessions").select("device, browser, utm_source, started_at").gte("started_at", since).limit(1000),
    ]);
    events = e.data ?? [];
    sessions = s.data ?? [];
  } catch {
    /* tables may not exist yet */
  }
  return <AnalyticsClient events={events} sessions={sessions} />;
}
