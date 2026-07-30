"use client";

import { useCallback, useEffect, useState } from "react";
import { useBusyStore } from "@/store/busy";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

export default function FaqsAdminPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/site-assets");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load FAQs");
      return;
    }
    setError("");
    setFaqs(
      (data.faqs ?? []).slice().sort((a: FaqRow, b: FaqRow) => a.sort_order - b.sort_order)
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/site-assets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    return data;
  }

  async function addFaq() {
    const question = draftQ.trim() || "New question?";
    const answer = draftA.trim() || "Answer…";
    await withBusy(async () => {
      await mutate({
        kind: "faq",
        item: {
          question,
          answer,
          sort_order: faqs.length,
          is_published: true,
        },
      });
      setDraftQ("");
      setDraftA("");
      setStatus("FAQ added");
      await load();
    }, "Adding…");
  }

  async function saveFaq(item: FaqRow) {
    await withBusy(async () => {
      await mutate({ kind: "faq", item });
      setStatus("Saved");
      await load();
    }, "Saving…");
  }

  async function deleteFaq(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    await withBusy(async () => {
      await mutate({ kind: "faq", action: "delete", id });
      setStatus("FAQ deleted");
      await load();
    }, "Deleting…");
  }

  async function togglePublished(item: FaqRow) {
    await saveFaq({ ...item, is_published: !item.is_published });
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = faqs.findIndex((f) => f.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= faqs.length) return;
    const next = faqs.slice();
    const a = next[idx];
    const b = next[swap];
    next[idx] = { ...b, sort_order: a.sort_order };
    next[swap] = { ...a, sort_order: b.sort_order };
    // Keep visual order indices as sort_order
    const ordered = next.map((f, i) => ({ ...f, sort_order: i }));
    setFaqs(ordered);
    await withBusy(async () => {
      await mutate({ kind: "faq", item: ordered[idx] });
      await mutate({ kind: "faq", item: ordered[swap] });
      setStatus("Order updated");
      await load();
    }, "Reordering…");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Storefront
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          FAQs
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mkos-muted">
          Add, edit, reorder, or delete questions shown in the homepage FAQ section.
        </p>
      </div>

      {error && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {status && <p className="text-sm text-mkos-accent">{status}</p>}

      <div className="border border-mkos-border bg-white p-5">
        <p className="font-display text-[11px] tracking-[0.22em] text-mkos-muted uppercase">
          Add FAQ
        </p>
        <div className="mt-4 space-y-3">
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Question"
            className="h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-ink"
          />
          <textarea
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            placeholder="Answer"
            rows={3}
            className="w-full border border-mkos-border px-3 py-2 text-sm outline-none focus:border-mkos-ink"
          />
          <button
            type="button"
            onClick={addFaq}
            className="h-11 bg-mkos-ink px-6 font-display text-[11px] tracking-[0.18em] text-white uppercase"
          >
            Add FAQ
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.length === 0 && !error ? (
          <p className="text-sm text-mkos-muted">No FAQs yet. Add the first one above.</p>
        ) : (
          faqs.map((f, i) => (
            <div key={f.id} className="border border-mkos-border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                  #{i + 1}
                  {!f.is_published && (
                    <span className="ml-2 text-amber-700">Hidden</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(f.id, -1)}
                    className="h-8 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase disabled:opacity-30"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={i === faqs.length - 1}
                    onClick={() => move(f.id, 1)}
                    className="h-8 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase disabled:opacity-30"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublished(f)}
                    className="h-8 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                  >
                    {f.is_published ? "Hide" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFaq(f.id)}
                    className="h-8 border border-red-200 px-3 font-display text-[9px] tracking-[0.14em] text-red-700 uppercase"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <input
                defaultValue={f.question}
                key={`${f.id}-q-${f.question}`}
                onBlur={(e) => {
                  const question = e.target.value.trim();
                  if (!question || question === f.question) return;
                  saveFaq({ ...f, question });
                }}
                className="mt-4 h-11 w-full border border-mkos-border px-3 text-sm font-medium outline-none focus:border-mkos-ink"
              />
              <textarea
                defaultValue={f.answer}
                key={`${f.id}-a-${f.answer}`}
                onBlur={(e) => {
                  const answer = e.target.value.trim();
                  if (!answer || answer === f.answer) return;
                  saveFaq({ ...f, answer });
                }}
                rows={4}
                className="mt-3 w-full border border-mkos-border px-3 py-2 text-sm leading-relaxed outline-none focus:border-mkos-ink"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
