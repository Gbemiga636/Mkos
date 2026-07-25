"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

type Ev = { event_type: string; path: string | null; occurred_at: string; label: string | null };
type Sess = { device: string | null; browser: string | null; utm_source: string | null; started_at: string };

export function AnalyticsClient({ events, sessions }: { events: Ev[]; sessions: Sess[] }) {
  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events.filter((x) => x.event_type === "page_view")) {
      const d = e.occurred_at.slice(0, 10);
      map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, views]) => ({ date: date.slice(5), views }));
  }, [events]);

  const devices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      const k = s.device || "unknown";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const clicks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events.filter((x) => x.event_type === "click")) {
      const k = (e.label || "click").slice(0, 40);
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      const k = s.utm_source || "direct";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Intelligence
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Analytics</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-mkos-border bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Page views (14 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byDay.length ? byDay : [{ date: "—", views: 0 }]}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c45c26" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#c45c26" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(17,17,17,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#6b6b6b" fontSize={11} />
                <YAxis stroke="#6b6b6b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid rgba(17,17,17,0.08)" }}
                />
                <Area type="monotone" dataKey="views" stroke="#c45c26" fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-mkos-border bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Devices</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={devices.length ? devices : [{ name: "—", value: 0 }]}>
                <CartesianGrid stroke="rgba(17,17,17,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#6b6b6b" fontSize={11} />
                <YAxis stroke="#6b6b6b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid rgba(17,17,17,0.08)" }}
                />
                <Bar dataKey="value" fill="#c45c26" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-mkos-border bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Top clicked elements</h2>
          <div className="space-y-2">
            {(clicks.length ? clicks : [{ name: "No clicks yet", value: 0 }]).map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span className="truncate text-mkos-ink/80">{c.name}</span>
                <span className="tabular-nums text-mkos-muted">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-mkos-border bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Traffic sources</h2>
          <div className="space-y-2">
            {(sources.length ? sources : [{ name: "direct", value: 0 }]).map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span className="capitalize text-mkos-ink/80">{c.name}</span>
                <span className="tabular-nums text-mkos-muted">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
