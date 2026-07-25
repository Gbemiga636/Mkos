import { createServiceClient } from "@/lib/supabase/client";
import { DashboardClient } from "@/components/admin/DashboardClient";

async function getOverview() {
  const sb = createServiceClient();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const liveCutoff = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

  // Prefer head counts over downloading all analytics rows (free-tier friendly)
  const [
    products,
    orders,
    viewsToday,
    viewsWeek,
    viewsMonth,
    live,
    lowStock,
    notifications,
    visitorsReturning,
    visitorsTotal,
    topEvents,
  ] = await Promise.all([
    sb
      .from("products")
      .select("id, stock, price, name, slug, featured")
      .eq("is_published", true),
    sb.from("orders").select("id, total, status, created_at"),
    sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("occurred_at", dayAgo),
    sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("occurred_at", weekAgo),
    sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("occurred_at", monthAgo),
    sb.from("analytics_live").select("session_id, path, last_seen_at").gte("last_seen_at", liveCutoff),
    sb.from("products").select("id, name, stock, slug").lte("stock", 5).order("stock").limit(12),
    sb
      .from("admin_notifications")
      .select("id, title, body, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    sb
      .from("analytics_visitors")
      .select("*", { count: "exact", head: true })
      .eq("is_returning", true),
    sb.from("analytics_visitors").select("*", { count: "exact", head: true }),
    sb
      .from("analytics_events")
      .select("path")
      .eq("event_type", "page_view")
      .gte("occurred_at", dayAgo)
      .limit(300),
  ]);

  const orderRows = orders.data ?? [];
  const revenue = orderRows.reduce((n, o) => n + Number(o.total || 0), 0);
  const pending = orderRows.filter((o) => o.status === "placed" || o.status === "pending").length;
  const completed = orderRows.filter((o) => o.status === "completed" || o.status === "placed").length;
  const cancelled = orderRows.filter((o) => o.status === "cancelled").length;

  const pathCounts: Record<string, number> = {};
  for (const e of topEvents.data ?? []) {
    const p = e.path || "/";
    pathCounts[p] = (pathCounts[p] || 0) + 1;
  }
  const topPages = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, count]) => ({ path, count }));

  const pageViewsToday = viewsToday.count ?? 0;
  const returning = visitorsReturning.count ?? 0;
  const totalVisitors = visitorsTotal.count ?? 0;

  return {
    visitorsToday: pageViewsToday,
    visitorsWeek: viewsWeek.count ?? 0,
    visitorsMonth: viewsMonth.count ?? 0,
    liveCount: live.data?.length ?? 0,
    liveSessions: live.data ?? [],
    productsCount: products.data?.length ?? 0,
    revenue,
    ordersCount: orderRows.length,
    pending,
    completed,
    cancelled,
    lowStock: lowStock.data ?? [],
    notifications: notifications.data ?? [],
    topPages,
    returning,
    newVisitors: Math.max(0, totalVisitors - returning),
    conversionRate:
      pageViewsToday > 0
        ? Number(((orderRows.length / Math.max(pageViewsToday, 1)) * 100).toFixed(2))
        : 0,
    productList: products.data ?? [],
  };
}

export default async function AdminDashboardPage() {
  let data;
  try {
    data = await getOverview();
  } catch {
    data = {
      visitorsToday: 0,
      visitorsWeek: 0,
      visitorsMonth: 0,
      liveCount: 0,
      liveSessions: [],
      productsCount: 0,
      revenue: 0,
      ordersCount: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      lowStock: [],
      notifications: [],
      topPages: [],
      returning: 0,
      newVisitors: 0,
      conversionRate: 0,
      productList: [],
    };
  }
  return <DashboardClient data={data} />;
}
