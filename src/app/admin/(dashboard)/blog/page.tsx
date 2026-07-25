"use client";

import { useEffect, useState } from "react";

type Post = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({ title: "", excerpt: "", body: "" });

  async function load() {
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", excerpt: "", body: "" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Editorial
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Blog CMS
        </h1>
      </div>
      <form onSubmit={create} className="space-y-3 border border-mkos-border bg-white p-5">
        <input
          required
          placeholder="Post title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="h-11 w-full border border-mkos-border px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <input
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="h-11 w-full border border-mkos-border px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <textarea
          placeholder="Body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="min-h-32 w-full border border-mkos-border px-3 py-2 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <button
          type="submit"
          className="h-11 bg-mkos-accent px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase"
        >
          Publish draft
        </button>
      </form>
      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id || p.slug} className="border border-mkos-border bg-white px-4 py-3">
            <p className="font-medium text-mkos-ink">{p.title}</p>
            <p className="text-xs text-mkos-muted">
              {p.status} · /{p.slug}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
