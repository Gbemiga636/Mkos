"use client";

import { useCallback, useEffect, useState } from "react";
import { useBusyStore } from "@/store/busy";

type Subscriber = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export default function SubscribersAdminPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/subscribers");
    const data = await res.json();
    setError(data.error && !data.subscribers?.length ? data.error : "");
    setHint(data.hint || "");
    setSubscribers(data.subscribers ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Remove this email from the list?")) return;
    await withBusy(async () => {
      await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
      await load();
    }, "Removing…");
  }

  function downloadCsv() {
    window.location.href = "/api/admin/subscribers?format=csv";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Audience
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
            Email list
          </h1>
          <p className="mt-2 max-w-xl text-sm text-mkos-muted">
            Emails collected from the storefront updates popup and newsletter forms.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="h-11 border border-mkos-border px-5 font-display text-[10px] tracking-[0.16em] uppercase"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!subscribers.length}
            className="h-11 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase disabled:opacity-40"
          >
            Download CSV
          </button>
        </div>
      </div>

      {(error || hint) && (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {hint || error}
        </p>
      )}

      <div className="border border-mkos-border bg-white">
        <div className="flex items-center justify-between border-b border-mkos-border px-4 py-3">
          <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
            {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
          </p>
        </div>

        {subscribers.length === 0 ? (
          <p className="px-4 py-10 text-sm text-mkos-muted">
            No emails yet. Once visitors join from the popup or footer, they’ll appear here.
          </p>
        ) : (
          <ul className="divide-y divide-mkos-border">
            {subscribers.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-mkos-ink">{s.email}</p>
                  <p className="mt-0.5 text-xs text-mkos-muted">
                    {s.source || "—"} ·{" "}
                    {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="font-display text-[9px] tracking-[0.14em] text-red-700 uppercase"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
