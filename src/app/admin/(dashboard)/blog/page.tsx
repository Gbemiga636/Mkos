"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusyStore } from "@/store/busy";
import { uploadMediaFile } from "@/lib/media/clientUpload";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
  cover_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  published_at?: string | null;
};

const empty = {
  title: "",
  excerpt: "",
  body: "",
  meta_title: "",
  meta_description: "",
  cover_image: "",
  status: "draft" as "draft" | "published",
};

export default function BlogAdminPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p: Post) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      excerpt: p.excerpt || "",
      body: p.body || "",
      meta_title: p.meta_title || "",
      meta_description: p.meta_description || "",
      cover_image: p.cover_image || "",
      status: p.status === "published" ? "published" : "draft",
    });
    setMsg("");
  }

  function reset() {
    setEditingId(null);
    setForm(empty);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await withBusy(async () => {
      const payload = {
        ...form,
        id: editingId || undefined,
        cover_image: form.cover_image || null,
      };
      const res = await fetch("/api/admin/blog", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      setMsg(form.status === "published" ? "Published to /blog" : "Draft saved");
      reset();
      await load();
    }, "Saving post…");
  }

  async function publish(id: string, status: "published" | "draft") {
    await withBusy(async () => {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      setMsg(status === "published" ? "Live on /blog" : "Unpublished");
      await load();
    }, "Updating…");
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await withBusy(async () => {
      await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      await load();
    }, "Deleting…");
  }

  async function aiFineTune(mode: "draft" | "refine") {
    if (!form.title.trim() && mode === "draft") {
      setMsg("Add a title first so AI knows the topic.");
      return;
    }
    await withBusy(async () => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blog",
          mode,
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          notes: form.meta_description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "AI unavailable — check OPENAI_API_KEY");
        return;
      }
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        excerpt: data.excerpt || f.excerpt,
        body: data.body || f.body,
        meta_title: data.meta_title || f.meta_title || data.title || f.title,
        meta_description: data.meta_description || f.meta_description || data.excerpt || f.excerpt,
      }));
      setMsg(mode === "draft" ? "AI draft ready — review and publish" : "AI refined — review and save");
    }, mode === "draft" ? "Drafting with AI…" : "Fine-tuning with AI…");
  }

  async function uploadCover(file: File) {
    await withBusy(async () => {
      const data = await uploadMediaFile(file, { folder: "blog", alt: form.title || file.name });
      if (!data.ok) {
        setMsg(data.error || "Upload failed");
        return;
      }
      setForm((f) => ({ ...f, cover_image: data.url }));
      setMsg("Cover uploaded");
    }, "Uploading cover…");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Editorial
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
            Blog CMS
          </h1>
          <p className="mt-2 text-sm text-mkos-muted">
            Publish essays to{" "}
            <Link href="/blog" target="_blank" className="underline underline-offset-2">
              /blog
            </Link>{" "}
            for SEO. Use AI to draft or fine-tune.
          </p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3 border border-mkos-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
            {editingId ? "Edit post" : "New post"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => aiFineTune("draft")}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
            >
              ✦ AI draft
            </button>
            <button
              type="button"
              onClick={() => aiFineTune("refine")}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
            >
              ✦ Fine-tune
            </button>
          </div>
        </div>
        <input
          required
          placeholder="Post title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="h-11 w-full border border-mkos-border px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <input
          placeholder="Excerpt (SEO summary)"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="h-11 w-full border border-mkos-border px-3 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <textarea
          placeholder="Body — separate paragraphs with a blank line"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="min-h-48 w-full border border-mkos-border px-3 py-2 text-sm text-mkos-ink outline-none focus:border-mkos-accent"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="SEO title (optional)"
            value={form.meta_title}
            onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
            className="h-11 w-full border border-mkos-border px-3 text-sm outline-none"
          />
          <input
            placeholder="SEO description (optional)"
            value={form.meta_description}
            onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            className="h-11 w-full border border-mkos-border px-3 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer font-display text-[10px] tracking-[0.16em] text-mkos-accent uppercase">
            Upload cover
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCover(file);
                e.target.value = "";
              }}
            />
          </label>
          {form.cover_image && (
            <span className="truncate text-xs text-mkos-muted">{form.cover_image}</span>
          )}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.status === "published"}
              onChange={(e) =>
                setForm({ ...form, status: e.target.checked ? "published" : "draft" })
              }
              className="accent-mkos-accent"
            />
            Publish now
          </label>
        </div>
        {msg && <p className="text-sm text-mkos-accent">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="h-11 bg-mkos-accent px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase"
          >
            {editingId ? "Update post" : form.status === "published" ? "Publish" : "Save draft"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="h-11 border border-mkos-border px-4 font-display text-[10px] tracking-[0.16em] uppercase"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {posts.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-mkos-border bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-mkos-ink">{p.title}</p>
              <p className="text-xs text-mkos-muted">
                {p.status} · /blog/{p.slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.status === "published" ? (
                <>
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="h-9 border border-mkos-border px-3 font-display text-[9px] leading-9 tracking-[0.14em] uppercase"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => publish(p.id, "draft")}
                    className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                  >
                    Unpublish
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => publish(p.id, "published")}
                  className="h-9 bg-mkos-ink px-3 font-display text-[9px] tracking-[0.14em] text-white uppercase"
                >
                  Publish
                </button>
              )}
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] text-red-700 uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!posts.length && <p className="text-sm text-mkos-muted">No posts yet.</p>}
      </div>
    </div>
  );
}
