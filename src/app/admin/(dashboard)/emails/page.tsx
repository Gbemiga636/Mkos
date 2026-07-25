"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminOrderEmailHtml,
  customerOrderEmailHtml,
  sampleOrderEmailPayload,
} from "@/lib/email/orderEmails";

export default function EmailPreviewPage() {
  const [tab, setTab] = useState<"customer" | "admin">("customer");
  const [origin, setOrigin] = useState("");
  const sample = useMemo(() => sampleOrderEmailPayload(), []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const html = tab === "customer" ? customerOrderEmailHtml(sample) : adminOrderEmailHtml(sample);
  const previewHtml = origin
    ? html.replaceAll('src="/images/', `src="${origin}/images/`)
    : html;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Communications
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
            Order email templates
          </h1>
          <p className="mt-2 max-w-xl text-sm text-mkos-muted">
            Preview of the emails Resend sends after Paystack confirms payment — one to the
            customer, one to the house.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              ["customer", "Customer"],
              ["admin", "Admin"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "h-10 bg-mkos-ink px-4 font-display text-[10px] tracking-[0.16em] text-white uppercase"
                  : "h-10 border border-mkos-border px-4 font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 border border-mkos-border bg-white p-4 text-sm text-mkos-muted">
          <p>
            <span className="font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase">
              Trigger
            </span>
            <br />
            Paystack success (verify API + webhook)
          </p>
          <p>
            <span className="font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase">
              Provider
            </span>
            <br />
            Resend · set <code className="text-xs">RESEND_API_KEY</code>
          </p>
          <p>
            <span className="font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase">
              From
            </span>
            <br />
            <code className="text-xs">RESEND_FROM_EMAIL</code>
          </p>
          <p>
            <span className="font-display text-[10px] tracking-[0.16em] text-mkos-ink uppercase">
              Admin inbox
            </span>
            <br />
            <code className="text-xs">ORDER_NOTIFY_EMAIL</code>
          </p>
        </aside>

        <div className="overflow-hidden border border-mkos-border bg-mkos-warm">
          <iframe
            title="Email preview"
            className="h-[75vh] w-full bg-white"
            srcDoc={previewHtml}
          />
        </div>
      </div>
    </div>
  );
}
