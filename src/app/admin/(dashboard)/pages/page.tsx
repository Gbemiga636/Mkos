"use client";

import { useEffect, useState } from "react";

export default function PagesAdminPage() {
  const [pages, setPages] = useState<{ id: string; slug: string; title: string; status: string }[]>(
    []
  );
  const [title, setTitle] = useState("");

  async function load() {
    const res = await fetch("/api/admin/pages");
    const data = await res.json();
    setPages(data.pages ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Structure
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Pages
        </h1>
      </div>
      <form onSubmit={create} className="flex gap-2">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New page title"
          className="h-11 flex-1 border border-mkos-border bg-white px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <button
          type="submit"
          className="h-11 bg-mkos-accent px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase"
        >
          Create
        </button>
      </form>
      <div className="space-y-2">
        {pages.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between border border-mkos-border bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-mkos-ink">{p.title}</p>
              <p className="text-xs text-mkos-muted">/{p.slug}</p>
            </div>
            <span className="text-xs capitalize text-mkos-accent">{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
