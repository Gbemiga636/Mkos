import { createServiceClient } from "@/lib/supabase/client";
import { DashboardClient } from "@/components/admin/DashboardClient";

async function getOverview() {
  const sb = createServiceClient();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Slightly longer window + unique by visitor (not every tab session)
  const liveCutoff = new Date(now.getTime() - 3 * 60 * 1000).toISOString();

  const [
    products,
    orders,
    visitorsToday,
    visitorsWeek,
    visitorsMonth,
    viewsToday,
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
    sb.from("orders").select("id, total, status, created_at, payment_status"),
    // Unique people (not page views)
    sb
      .from("analytics_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", dayAgo),
    sb
      .from("analytics_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", weekAgo),
    sb
      .from("analytics_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", monthAgo),
    sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("occurred_at", dayAgo),
    sb
      .from("analytics_live")
      .select("session_id, visitor_id, path, last_seen_at")
      .gte("last_seen_at", liveCutoff),
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

  const orderRows = (orders.data ?? []).filter(
    (o) => o.payment_status === "paid" || o.status === "paid" || o.status === "completed"
  );
  const revenue = orderRows.reduce((n, o) => n + Number(o.total || 0), 0);
  const allOrders = orders.data ?? [];
  const pending = allOrders.filter(
    (o) => o.status === "placed" || o.status === "pending" || o.payment_status === "pending"
  ).length;

  const pathCounts: Record<string, number> = {};
  for (const e of topEvents.data ?? []) {
    const p = e.path || "/";
    pathCounts[p] = (pathCounts[p] || 0) + 1;
  }
  const topPages = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, count]) => ({ path, count }));

  const uniqueLive = new Set(
    (live.data ?? []).map((r) => r.visitor_id || r.session_id).filter(Boolean)
  );
  const uniqueToday = visitorsToday.count ?? 0;
  const pageViewsToday = viewsToday.count ?? 0;
  const returning = visitorsReturning.count ?? 0;
  const totalVisitors = visitorsTotal.count ?? 0;

  return {
    visitorsToday: uniqueToday,
    visitorsWeek: visitorsWeek.count ?? 0,
    visitorsMonth: visitorsMonth.count ?? 0,
    pageViewsToday,
    liveCount: uniqueLive.size,
    liveSessions: live.data ?? [],
    productsCount: products.data?.length ?? 0,
    revenue,
    ordersCount: orderRows.length,
    pending,
    completed: orderRows.length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
    lowStock: lowStock.data ?? [],
    notifications: notifications.data ?? [],
    topPages,
    returning,
    newVisitors: Math.max(0, totalVisitors - returning),
    conversionRate:
      uniqueToday > 0 ? Number(((orderRows.length / Math.max(uniqueToday, 1)) * 100).toFixed(2)) : 0,
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
      pageViewsToday: 0,
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
