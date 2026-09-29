import type { SupabaseClient } from "@supabase/supabase-js";

export function monthlyReportKey(year: number, month: number) {
  return `monthly_report_${year}_${String(month).padStart(2, "0")}`;
}

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

function isPaid(o: { payment_status?: string | null; status?: string | null }) {
  const ps = String(o.payment_status || "").toLowerCase();
  const st = String(o.status || "").toLowerCase();
  return ps === "paid" || st === "paid" || st === "completed";
}

function moneyByCurrency(rows: { total?: number | null; currency?: string | null }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const cur = String(r.currency || "USD").toUpperCase();
    map[cur] = (map[cur] || 0) + Number(r.total || 0);
  }
  return Object.entries(map)
    .map(([currency, total]) => ({
      currency,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}

const ORDER_COLUMNS =
  "id, email, shipping_name, total, currency, status, payment_status, paid_at, created_at, delivery_method, paystack_reference, order_items(name, quantity, price, slug)";

export async function buildMonthlyReport(
  sb: SupabaseClient,
  year: number,
  month: number,
  defaultPreparedBy: string
) {
  const { start, end } = monthBounds(year, month);
  const reportKey = monthlyReportKey(year, month);

  const [
    ordersCreatedRes,
    ordersPaidRes,
    productsRes,
    subscribersRes,
    experienceRes,
    briefsRes,
    visitorsRes,
    viewsRes,
    savedRes,
  ] = await Promise.all([
    sb
      .from("orders")
      .select(ORDER_COLUMNS)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false }),
    sb
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("payment_status", "paid")
      .gte("paid_at", start)
      .lt("paid_at", end)
      .order("paid_at", { ascending: false }),
    sb.from("products").select("id, name, slug, stock, is_published, price, price_usd"),
    sb
      .from("newsletter_subscribers")
      .select("id, email, created_at")
      .gte("created_at", start)
      .lt("created_at", end),
    sb
      .from("experience_inquiries")
      .select("id, created_at, kind, full_name, email")
      .gte("created_at", start)
      .lt("created_at", end),
    sb
      .from("style_briefs")
      .select("id, created_at, payload, full_name, email")
      .gte("created_at", start)
      .lt("created_at", end),
    sb
      .from("analytics_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", start)
      .lt("last_seen_at", end),
    sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("occurred_at", start)
      .lt("occurred_at", end),
    sb.from("site_content").select("extra").eq("key", reportKey).maybeSingle(),
  ]);

  if (ordersCreatedRes.error) throw new Error(ordersCreatedRes.error.message);
  if (ordersPaidRes.error) throw new Error(ordersPaidRes.error.message);

  const byId = new Map<string, NonNullable<typeof ordersCreatedRes.data>[number]>();
  for (const o of [...(ordersCreatedRes.data || []), ...(ordersPaidRes.data || [])]) {
    byId.set(o.id, o);
  }
  const allOrders = [...byId.values()];
  const paidOrders = allOrders
    .filter(isPaid)
    .sort((a, b) =>
      String(b.paid_at || b.created_at).localeCompare(String(a.paid_at || a.created_at))
    );
  const pendingOrders = allOrders.filter(
    (o) =>
      !isPaid(o) &&
      ["pending", "pending_payment", "placed"].includes(
        String(o.payment_status || o.status || "").toLowerCase()
      )
  );

  const revenueByCurrency = moneyByCurrency(paidOrders);
  const itemCounts = new Map<string, { name: string; slug?: string; qty: number; revenue: number }>();
  for (const order of paidOrders) {
    const items = (order.order_items || []) as {
      name?: string;
      slug?: string;
      quantity?: number;
      price?: number;
    }[];
    for (const item of items) {
      const key = item.slug || item.name || "item";
      const prev = itemCounts.get(key) || {
        name: item.name || key,
        slug: item.slug,
        qty: 0,
        revenue: 0,
      };
      const qty = Number(item.quantity) || 0;
      prev.qty += qty;
      prev.revenue += qty * Number(item.price || 0);
      itemCounts.set(key, prev);
    }
  }
  const topProducts = [...itemCounts.values()]
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
    }));

  const deliveryBreakdown: Record<string, number> = {};
  for (const o of paidOrders) {
    const m = String(o.delivery_method || "unspecified");
    deliveryBreakdown[m] = (deliveryBreakdown[m] || 0) + 1;
  }

  const briefs = briefsRes.data || [];
  const bespokeCount = briefs.filter((b) => {
    const payload = (b.payload || {}) as Record<string, unknown>;
    return String(payload.kind || "").toLowerCase() === "bespoke";
  }).length;
  const bridalCount = briefs.filter((b) => {
    const payload = (b.payload || {}) as Record<string, unknown>;
    const kind = String(payload.kind || "").toLowerCase();
    return kind === "bridal" || Boolean(payload.weddingDate || payload.primaryContactName);
  }).length;
  const styleBriefCount = Math.max(0, briefs.length - bespokeCount - bridalCount);

  const products = productsRes.data || [];
  const lowStock = products
    .filter((p) => p.is_published !== false && Number(p.stock ?? 0) <= 5)
    .map((p) => ({
      name: p.name as string,
      slug: p.slug as string,
      stock: Number(p.stock ?? 0),
    }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const paidCount = paidOrders.length;
  const aovByCurrency = revenueByCurrency.map((r) => {
    const n = paidOrders.filter(
      (o) => String(o.currency || "USD").toUpperCase() === r.currency
    ).length;
    return {
      currency: r.currency,
      aov: n > 0 ? Math.round((r.total / n) * 100) / 100 : 0,
    };
  });

  const savedExtra = (savedRes.data?.extra || {}) as Record<string, unknown>;
  const str = (key: string, fallback: string) =>
    typeof savedExtra[key] === "string" ? (savedExtra[key] as string) : fallback;
  const num = (key: string) => (savedExtra[key] != null ? Number(savedExtra[key]) : null);

  return {
    ok: true as const,
    period: {
      year,
      month,
      label: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      start,
      end,
    },
    metrics: {
      paidOrders: paidCount,
      pendingOrders: pendingOrders.length,
      allOrdersInPeriod: allOrders.length,
      revenueByCurrency,
      aovByCurrency,
      newSubscribers: (subscribersRes.data || []).length,
      visitors: visitorsRes.count || 0,
      pageViews: viewsRes.count || 0,
      experienceInquiries: (experienceRes.data || []).length,
      styleBriefs: styleBriefCount,
      bespokeInquiries: bespokeCount,
      bridalInquiries: bridalCount,
      publishedProducts: products.filter((p) => p.is_published !== false).length,
      lowStockCount: lowStock.length,
    },
    topProducts,
    deliveryBreakdown,
    lowStock,
    recentPaidOrders: paidOrders.slice(0, 12).map((o) => ({
      reference: o.paystack_reference as string | null,
      name: o.shipping_name as string | null,
      email: o.email as string | null,
      total: Number(o.total || 0),
      currency: (o.currency as string) || "USD",
      paidAt: (o.paid_at || o.created_at) as string,
      items: ((o.order_items || []) as { name?: string; quantity?: number }[])
        .map((i) => `${i.name} × ${i.quantity || 1}`)
        .join(", "),
    })),
    editable: {
      summary: str(
        "summary",
        "A strong month for My Kind of Style — paid orders, studio enquiries, and brand visibility continued to grow. Use this space to capture the story of the month in your own words."
      ),
      highlights: str(
        "highlights",
        "• Strong conversion on Ready-to-Wear\n• Steady bespoke / bridal enquiry flow\n• Newsletter list growth"
      ),
      challenges: str(
        "challenges",
        "• Follow up pending payments\n• Restock low-inventory bestsellers\n• Improve international delivery communication"
      ),
      nextMonthPlan: str(
        "nextMonthPlan",
        "• Launch / push next collection drop\n• Personal outreach to open enquiries\n• Content for Instagram + MKoS Experience\n• Review pricing and promo performance"
      ),
      goals: str(
        "goals",
        "Revenue target · Enquiry response under 24h · Restock top 3 styles · Publish 2 studio stories"
      ),
      notes: str("notes", ""),
      customRevenueUsd: num("customRevenueUsd"),
      customRevenueNgn: num("customRevenueNgn"),
      customOrders: num("customOrders"),
      preparedBy: str("preparedBy", defaultPreparedBy),
    },
  };
}

export type MonthlyReport = Awaited<ReturnType<typeof buildMonthlyReport>>;
