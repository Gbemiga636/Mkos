"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/cms/types";

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span>{display}</motion.span>;
}

type Data = {
  visitorsToday: number;
  visitorsWeek: number;
  visitorsMonth: number;
  liveCount: number;
  liveSessions: { session_id: string; path: string | null; last_seen_at: string }[];
  productsCount: number;
  revenue: number;
  ordersCount: number;
  pending: number;
  completed: number;
  cancelled: number;
  lowStock: { id: string; name: string; stock: number; slug: string }[];
  notifications: { id: string; title: string; body: string | null; kind: string; created_at: string }[];
  topPages: { path: string; count: number }[];
  returning: number;
  newVisitors: number;
  conversionRate: number;
};

export function DashboardClient({ data }: { data: Data }) {
  const cards = [
    { label: "Visitors today", value: data.visitorsToday, hint: "Last 24h" },
    { label: "This week", value: data.visitorsWeek, hint: "7-day activity" },
    { label: "This month", value: data.visitorsMonth, hint: "30-day activity" },
    { label: "Live now", value: data.liveCount, hint: "Active now" },
    { label: "Orders", value: data.ordersCount, hint: `${data.pending} pending` },
    { label: "Revenue", value: data.revenue, hint: "All-time", money: true },
    { label: "Conversion", value: data.conversionRate, hint: "Estimate %" },
    { label: "Products", value: data.productsCount, hint: "Published" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Overview
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Command center
          </h1>
          <p className="mt-2 text-sm text-mkos-muted">Live storefront intelligence for MKoS.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase"
          >
            Products
          </Link>
          <Link
            href="/admin/content"
            className="inline-flex h-11 items-center border border-mkos-border px-5 font-display text-[10px] tracking-[0.18em] uppercase"
          >
            Edit website
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="border border-mkos-border bg-white p-5"
          >
            <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              {c.label}
            </p>
            <p className="mt-3 font-display text-3xl tracking-tight">
              {c.money ? formatPrice(c.value) : <AnimatedNumber value={c.value} />}
              {!c.money && c.label === "Conversion" ? "%" : null}
            </p>
            <p className="mt-2 text-xs text-mkos-muted">{c.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-mkos-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Most viewed pages</h2>
            <Link href="/admin/analytics" className="text-xs text-mkos-accent">
              Analytics →
            </Link>
          </div>
          <div className="space-y-3">
            {(data.topPages.length ? data.topPages : [{ path: "/", count: 0 }]).map((p) => (
              <div key={p.path} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.path}</p>
                  <div className="mt-1 h-1.5 overflow-hidden bg-mkos-warm">
                    <div
                      className="h-full bg-mkos-accent"
                      style={{
                        width: `${Math.min(100, (p.count / Math.max(data.topPages[0]?.count || 1, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm tabular-nums text-mkos-muted">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-mkos-border pt-6">
            <div>
              <p className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                New visitors
              </p>
              <p className="mt-1 font-display text-2xl">{data.newVisitors}</p>
            </div>
            <div>
              <p className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                Returning
              </p>
              <p className="mt-1 font-display text-2xl">{data.returning}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-mkos-border bg-white p-5">
            <h2 className="font-display text-xl tracking-tight">Live visitors</h2>
            <p className="mt-1 text-sm text-mkos-muted">{data.liveCount} browsing now</p>
            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
              {data.liveSessions.map((s) => (
                <div
                  key={s.session_id}
                  className="flex items-center justify-between bg-mkos-warm/60 px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {s.path || "/"}
                  </span>
                  <span className="text-mkos-muted">
                    {new Date(s.last_seen_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {!data.liveSessions.length && (
                <p className="text-sm text-mkos-muted">No live sessions yet — open the storefront.</p>
              )}
            </div>
          </div>

          <div className="border border-mkos-border bg-white p-5">
            <h2 className="font-display text-xl tracking-tight">Low stock</h2>
            <div className="mt-4 space-y-2">
              {data.lowStock.map((p) => (
                <Link
                  key={p.id}
                  href="/admin/products"
                  className="flex items-center justify-between px-1 py-2 text-sm hover:bg-mkos-warm"
                >
                  <span>{p.name}</span>
                  <span className="text-mkos-accent">{p.stock} left</span>
                </Link>
              ))}
              {!data.lowStock.length && (
                <p className="text-sm text-mkos-muted">Inventory looks healthy.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-mkos-border bg-white p-5">
          <h2 className="font-display text-xl tracking-tight">Orders pulse</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["Pending", data.pending],
              ["Completed", data.completed],
              ["Cancelled", data.cancelled],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-mkos-warm/70 p-4">
                <p className="font-display text-2xl">{value as number}</p>
                <p className="mt-1 font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                  {label as string}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-mkos-border bg-white p-5">
          <h2 className="font-display text-xl tracking-tight">Notifications</h2>
          <div className="mt-4 space-y-3">
            {data.notifications.map((n) => (
              <div key={n.id} className="border-b border-mkos-border pb-3 last:border-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-1 text-xs text-mkos-muted">{n.body}</p>
              </div>
            ))}
            {!data.notifications.length && (
              <p className="text-sm text-mkos-muted">You’re all caught up.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
