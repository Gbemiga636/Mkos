"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/cms/types";
import { useBusyStore } from "@/store/busy";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/media/clientUpload";

type Product = {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  story?: string;
  price: number;
  stock: number;
  is_published: boolean;
  images: string[];
  category_slug: string | null;
  collection_slug: string | null;
  featured?: boolean;
  new_arrival?: boolean;
  best_seller?: boolean;
  trending?: boolean;
  material?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  tags?: string[];
};

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  price: "0",
  stock: "10",
  tagline: "",
  description: "",
  story: "",
  material: "",
  collection: "women",
  category: "ready-to-wear",
  images: [] as string[],
  featured: false,
  newArrival: false,
  bestSeller: false,
  trending: false,
  isPublished: true,
  sizes: "XS, S, M, L, XL",
};

export default function AdminProductsPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditing(true);
    setMsg("");
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price ?? 0),
      stock: String(p.stock ?? 0),
      tagline: p.tagline ?? "",
      description: p.description ?? "",
      story: p.story ?? "",
      material: p.material ?? "",
      collection: p.collection_slug || "women",
      category: p.category_slug || "ready-to-wear",
      images: Array.isArray(p.images) ? p.images : [],
      featured: !!p.featured,
      newArrival: !!p.new_arrival,
      bestSeller: !!p.best_seller,
      trending: !!p.trending,
      isPublished: p.is_published !== false,
      sizes: (p.sizes ?? ["XS", "S", "M", "L", "XL"]).join(", "),
    });
    setEditing(true);
    setMsg("");
  }

  async function uploadImage(file: File) {
    await withBusy(async () => {
      const data = await uploadMediaFile(file, {
        folder: "products",
        alt: form.name || file.name,
      });
      if (!data.ok) {
        setMsg(data.error || "Upload failed");
        return;
      }
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      setMsg(
        data.wasCompressed
          ? `Compressed ${data.originalSize} → ${data.compressedSize}`
          : "Image uploaded"
      );
    }, "Compressing & uploading…");
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    await withBusy(async () => {
      const payload = {
        id: form.id || undefined,
        name: form.name,
        slug: form.slug || undefined,
        price: Number(form.price),
        stock: Number(form.stock),
        tagline: form.tagline,
        description: form.description,
        story: form.story,
        material: form.material,
        collection: form.collection,
        category: form.category,
        images: form.images,
        featured: form.featured,
        newArrival: form.newArrival,
        bestSeller: form.bestSeller,
        trending: form.trending,
        isPublished: form.isPublished,
        sizes: form.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        colors: [{ name: "Default", hex: "#111111" }],
        tags: [],
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      setMsg("Saved — live on the storefront");
      setEditing(false);
      await load();
    }, "Saving product…");
  }

  async function remove(id: string) {
    if (!confirm("Delete this product from the live catalogue?")) return;
    await withBusy(async () => {
      await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      await load();
    }, "Deleting…");
  }

  async function aiFillField(field: "tagline" | "description" | "story" | "all") {
    if (!form.name.trim()) {
      setMsg("Enter a product name first so AI can write from it.");
      return;
    }
    const labels = {
      tagline: "Writing tagline…",
      description: "Writing description…",
      story: "Writing story…",
      all: "Writing copy…",
    } as const;
    await withBusy(async () => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          collection: form.collection,
          category: form.category,
          material: form.material,
          field,
          existingTagline: form.tagline,
          existingDescription: form.description,
          existingStory: form.story,
          notes: [form.tagline, form.description, form.story].filter(Boolean).join(" · "),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "AI unavailable — check OPENAI_API_KEY in .env.local");
        return;
      }
      setForm((f) => ({
        ...f,
        tagline: field === "all" || field === "tagline" ? data.tagline || f.tagline : f.tagline,
        description:
          field === "all" || field === "description"
            ? data.description || f.description
            : f.description,
        story: field === "all" || field === "story" ? data.story || f.story : f.story,
      }));
      setMsg(
        field === "all"
          ? "AI copy ready — review and save"
          : `AI ${field} ready — review and save`
      );
    }, labels[field]);
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Catalogue
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-sm text-mkos-muted">
            Edit price, stock, images, and copy — changes go live on the site.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="h-11 w-48 border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent sm:w-56"
          />
          <button
            type="button"
            onClick={openCreate}
            className="h-11 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase"
          >
            New product
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-mkos-muted">Loading catalogue…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="border border-mkos-border bg-white">
              <div className="relative aspect-[4/5] bg-mkos-warm">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="400px" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-mkos-muted">No image</div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg tracking-tight">{p.name}</p>
                    <p className="text-xs text-mkos-muted">{p.slug}</p>
                  </div>
                  <span
                    className={cn(
                      "font-display text-[9px] tracking-[0.16em] uppercase",
                      p.is_published ? "text-emerald-700" : "text-mkos-muted"
                    )}
                  >
                    {p.is_published ? "Live" : "Draft"}
                  </span>
                </div>
                <p className="text-sm tabular-nums text-mkos-muted">
                  {formatPrice(Number(p.price))} · Stock {p.stock}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="h-9 bg-mkos-ink px-3 font-display text-[9px] tracking-[0.16em] text-white uppercase"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/product/${p.slug}`}
                    target="_blank"
                    className="inline-flex h-9 items-center border border-mkos-border px-3 font-display text-[9px] tracking-[0.16em] uppercase"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="h-9 px-3 font-display text-[9px] tracking-[0.16em] text-red-600 uppercase"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !filtered.length && (
        <p className="text-sm text-mkos-muted">No products found. Create one to get started.</p>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-mkos-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <form
            onSubmit={saveProduct}
            className="max-h-[94vh] w-full max-w-3xl overflow-y-auto border border-mkos-border bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-mkos-border bg-white px-5 py-4">
              <div>
                <p className="font-display text-[10px] tracking-[0.22em] text-mkos-accent uppercase">
                  {form.id ? "Edit product" : "New product"}
                </p>
                <h2 className="font-display text-xl tracking-tight">
                  {form.name || "Untitled piece"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Price (NGN)
                </span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Stock / quantity
                </span>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Collection
                </span>
                <select
                  value={form.collection}
                  onChange={(e) => setForm({ ...form, collection: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="bridal">Bridal</option>
                </select>
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Category
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                >
                  <option value="ready-to-wear">Ready-to-Wear</option>
                  <option value="aso-ebi">Aso Ebi</option>
                  <option value="custom">Custom</option>
                  <option value="men">Men</option>
                  <option value="bridal">Bridal</option>
                </select>
              </label>
              <div className="block sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Tagline
                  </span>
                  <button
                    type="button"
                    onClick={() => aiFillField("tagline")}
                    className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-mkos-warm/60 px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase transition hover:border-mkos-accent hover:bg-white"
                    title="Generate tagline from product name"
                  >
                    <span aria-hidden>✦</span> AI
                  </button>
                </div>
                <input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                />
              </div>
              <div className="block sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Description
                  </span>
                  <button
                    type="button"
                    onClick={() => aiFillField("description")}
                    className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-mkos-warm/60 px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase transition hover:border-mkos-accent hover:bg-white"
                    title="Generate description from product name"
                  >
                    <span aria-hidden>✦</span> AI
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-24 w-full border border-mkos-border px-3 py-2 text-sm outline-none focus:border-mkos-accent"
                />
              </div>
              <div className="block sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Story
                  </span>
                  <button
                    type="button"
                    onClick={() => aiFillField("story")}
                    className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-mkos-warm/60 px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase transition hover:border-mkos-accent hover:bg-white"
                    title="Generate story from product name"
                  >
                    <span aria-hidden>✦</span> AI
                  </button>
                </div>
                <textarea
                  value={form.story}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  className="min-h-24 w-full border border-mkos-border px-3 py-2 text-sm outline-none focus:border-mkos-accent"
                />
              </div>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Material
                </span>
                <input
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                  Sizes (comma separated)
                </span>
                <input
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-mkos-border px-3 text-sm outline-none"
                />
              </label>

              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Images
                  </span>
                  <label className="cursor-pointer font-display text-[10px] tracking-[0.16em] text-mkos-accent uppercase">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {form.images.map((src, i) => (
                    <div key={src} className="group relative aspect-square border border-mkos-border bg-mkos-warm">
                      <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
                        }
                        className="absolute top-1 right-1 bg-white/90 px-1.5 text-[10px] opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {!form.images.length && (
                    <p className="col-span-full text-sm text-mkos-muted">
                      No images yet — upload product photos here.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 sm:col-span-2">
                {(
                  [
                    ["featured", "Featured"],
                    ["newArrival", "New arrival"],
                    ["bestSeller", "Best seller"],
                    ["trending", "Trending"],
                    ["isPublished", "Published"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="accent-mkos-accent"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {msg && <p className="px-5 pb-2 text-sm text-mkos-accent">{msg}</p>}

            <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-mkos-border bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => aiFillField("all")}
                className="h-11 border border-mkos-border px-4 font-display text-[10px] tracking-[0.16em] uppercase"
              >
                ✦ AI all copy
              </button>
              <button
                type="submit"
                className="h-11 flex-1 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase sm:flex-none"
              >
                Save product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
