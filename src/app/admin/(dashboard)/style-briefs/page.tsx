"use client";

import { useCallback, useEffect, useState } from "react";
import { useBusyStore } from "@/store/busy";

type Brief = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "in_progress", "closed"] as const;

export default function StyleBriefsAdminPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/style-briefs");
    const data = await res.json();
    if (data.error && !data.briefs?.length) setError(data.error);
    else setError("");
    setBriefs(data.briefs ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await withBusy(async () => {
      await fetch("/api/admin/style-briefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    }, "Updating…");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Atelier
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Style briefs
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mkos-muted">
          Client Style Brief submissions. Each one is also emailed to the house with Reply-To set
          to the client.
        </p>
      </div>

      {error && (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.includes("does not exist") || error.includes("schema cache")
            ? "Run migration 010_style_briefs.sql in Supabase, then refresh. Emails still arrive without the table."
            : error}
        </p>
      )}

      <div className="overflow-hidden border border-mkos-border bg-white">
        {briefs.map((row) => {
          const p = row.payload || {};
          return (
            <div key={row.id} className="border-b border-mkos-border px-4 py-5 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-base font-medium text-mkos-ink">{row.full_name}</p>
                  <p className="text-sm text-mkos-muted">
                    <a href={`mailto:${row.email}`} className="underline underline-offset-2">
                      {row.email}
                    </a>
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                </div>
                <select
                  value={row.status}
                  onChange={(e) => setStatus(row.id, e.target.value)}
                  className="border border-mkos-border bg-mkos-warm px-3 py-2 text-xs uppercase tracking-wider"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <dl className="mt-4 grid gap-2 text-sm text-mkos-ink/80 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-mkos-muted">Event</dt>
                  <dd>
                    {Array.isArray(p.eventTypes) ? p.eventTypes.join(", ") : "—"}
                    {p.eventOther ? ` · ${String(p.eventOther)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-mkos-muted">Outfit</dt>
                  <dd>
                    {Array.isArray(p.outfitTypes) ? p.outfitTypes.join(", ") : "—"}
                    {p.outfitOther ? ` · ${String(p.outfitOther)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-mkos-muted">Delivery</dt>
                  <dd>{String(p.deliveryMethod || "—")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-mkos-muted">Content</dt>
                  <dd>{String(p.contentPermission || "—")}</dd>
                </div>
                {p.budget ? (
                  <div>
                    <dt className="text-xs text-mkos-muted">Budget</dt>
                    <dd>{String(p.budget)}</dd>
                  </div>
                ) : null}
                {p.additionalRequests ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-mkos-muted">Notes</dt>
                    <dd>{String(p.additionalRequests)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          );
        })}
        {!briefs.length && !error && (
          <p className="p-6 text-sm text-mkos-muted">No style briefs yet.</p>
        )}
      </div>
    </div>
  );
}
