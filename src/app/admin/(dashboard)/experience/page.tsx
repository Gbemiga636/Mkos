"use client";

import { useCallback, useEffect, useState } from "react";
import { useBusyStore } from "@/store/busy";

type Inquiry = {
  id: string;
  kind: "content" | "full_glam";
  full_name: string;
  email: string;
  phone: string | null;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "booked", "closed"] as const;

export default function ExperienceAdminPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/experience");
    const data = await res.json();
    if (data.error && !data.inquiries?.length) {
      setError(data.error);
    } else {
      setError("");
    }
    setInquiries(data.inquiries ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await withBusy(async () => {
      await fetch("/api/admin/experience", {
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
          Studio
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Experience inquiries
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mkos-muted">
          Content consent and Full Glam consultation requests. You also receive each one by email
          (reply directly to reach the client).
        </p>
      </div>

      {error && (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.includes("does not exist") || error.includes("schema cache")
            ? "Run migration 008_experience_inquiries.sql in Supabase, then refresh. Emails still arrive without the table."
            : error}
        </p>
      )}

      <div className="overflow-hidden border border-mkos-border bg-white">
        {inquiries.map((row) => {
          const p = row.payload || {};
          const isGlam = row.kind === "full_glam";
          return (
            <div
              key={row.id}
              className="border-b border-mkos-border px-4 py-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                    {isGlam ? "Full Glam" : "Content"} ·{" "}
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
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <dl className="mt-4 grid gap-2 text-sm text-mkos-ink/80 sm:grid-cols-2">
                {isGlam ? (
                  <>
                    <div>
                      <dt className="text-xs text-mkos-muted">Event</dt>
                      <dd>
                        {String(p.eventType || "—")}
                        {p.eventDate ? ` · ${String(p.eventDate)}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-mkos-muted">Services</dt>
                      <dd>
                        {Array.isArray(p.services) ? p.services.join(", ") : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-mkos-muted">Consultation</dt>
                      <dd>{String(p.consultation || "—")}</dd>
                    </div>
                    {p.glamNotes ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-mkos-muted">Notes</dt>
                        <dd>{String(p.glamNotes)}</dd>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-xs text-mkos-muted">Filmed</dt>
                      <dd>{String(p.filmed || "—")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-mkos-muted">Posted</dt>
                      <dd>{String(p.posted || "—")}</dd>
                    </div>
                    {p.visitWindow ? (
                      <div>
                        <dt className="text-xs text-mkos-muted">Visit window</dt>
                        <dd>{String(p.visitWindow)}</dd>
                      </div>
                    ) : null}
                    {p.contentNotes ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-mkos-muted">Notes</dt>
                        <dd>{String(p.contentNotes)}</dd>
                      </div>
                    ) : null}
                  </>
                )}
              </dl>
            </div>
          );
        })}
        {!inquiries.length && !error && (
          <p className="p-6 text-sm text-mkos-muted">No experience inquiries yet.</p>
        )}
      </div>
    </div>
  );
}
