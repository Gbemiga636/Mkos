"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/cms/types";
import { useBusyStore } from "@/store/busy";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/media/clientUpload";
import { ProductDraftsModal } from "@/components/admin/ProductDraftsModal";

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
  collection: "ready-to-wear",
  category: "women-rtw",
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
  const [drafts, setDrafts] = useState([emptyForm]);
  const [msg, setMsg] = useState("");

  function updateDraft(index: number, patch: Partial<typeof emptyForm>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function openCreate() {
    setDrafts([{ ...emptyForm }]);
    setEditing(true);
    setMsg("");
  }

  function openEdit(p: Product) {
    setDrafts([
      {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: String(p.price ?? 0),
        stock: String(p.stock ?? 0),
        tagline: p.tagline ?? "",
        description: p.description ?? "",
        story: p.story ?? "",
        material: p.material ?? "",
        collection: p.collection_slug || "ready-to-wear",
        category: p.category_slug || "women-rtw",
        images: Array.isArray(p.images) ? p.images : [],
        featured: !!p.featured,
        newArrival: !!p.new_arrival,
        bestSeller: !!p.best_seller,
        trending: !!p.trending,
        isPublished: p.is_published !== false,
        sizes: (p.sizes ?? ["XS", "S", "M", "L", "XL"]).join(", "),
      },
    ]);
    setEditing(true);
    setMsg("");
  }

  function addDraft() {
    setDrafts((prev) => [...prev, { ...emptyForm }]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function uploadImage(file: File, index: number) {
    await withBusy(async () => {
      const data = await uploadMediaFile(file, {
        folder: "products",
        alt: drafts[index]?.name || file.name,
      });
      if (!data.ok) {
        setMsg(data.error || "Upload failed");
        return;
      }
      setDrafts((prev) =>
        prev.map((d, i) => (i === index ? { ...d, images: [...d.images, data.url] } : d))
      );
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
    const named = drafts.filter((d) => d.name.trim());
    if (!named.length) {
      setMsg("Add at least one product name");
      return;
    }
    await withBusy(async () => {
      const products = named.map((form) => ({
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
      }));
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products.length === 1 && products[0].id ? products[0] : { products }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      const count = data.count ?? 1;
      setMsg(
        count > 1
          ? `Saved ${count} products — live on the storefront`
          : "Saved — live on the storefront"
      );
      setEditing(false);
      await load();
    }, named.length > 1 ? "Saving products…" : "Saving product…");
  }

  async function aiFillField(
    index: number,
    field: "tagline" | "description" | "story" | "all"
  ) {
    const form = drafts[index];
    if (!form?.name.trim()) {
      setMsg("Enter a product name first so AI can write from it.");
      return;
    }
    const labels = {
      tagline: "Writing tagline…",
      description: "Writing description…",
      story: "Writing story…",
      all: "Writing all copy…",
    };
    await withBusy(async () => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          collection: form.collection,
          material: form.material,
          field,
          existingTagline: form.tagline,
          existingDescription: form.description,
          existingStory: form.story,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "AI failed");
        return;
      }
      updateDraft(index, {
        tagline: field === "all" || field === "tagline" ? data.tagline || form.tagline : form.tagline,
        description:
          field === "all" || field === "description"
            ? data.description || form.description
            : form.description,
        story: field === "all" || field === "story" ? data.story || form.story : form.story,
      });
      setMsg("AI copy applied");
    }, labels[field]);
  }

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("women-rtw");
  const [bulkCollection, setBulkCollection] = useState("ready-to-wear");

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

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const ids = new Set(filtered.map((p) => p.id));
      setSelected((prev) => prev.filter((id) => !ids.has(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...filtered.map((p) => p.id)])));
    }
  }

  async function bulkAction(
    action: "sold_out" | "restock" | "category" | "collection" | "publish" | "unpublish" | "delete",
    value?: string
  ) {
    if (!selected.length) return;
    if (action === "delete") {
      if (
        !confirm(
          `Delete ${selected.length} product${selected.length === 1 ? "" : "s"} from the live catalogue?`
        )
      ) {
        return;
      }
      await withBusy(async () => {
        const res = await fetch("/api/admin/products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selected }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMsg(data.error || "Delete failed");
          return;
        }
        setSelected([]);
        setMsg(`Deleted ${data.deleted ?? selected.length} product(s)`);
        await load();
      }, "Deleting…");
      return;
    }

    await withBusy(async () => {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      const labels: Record<string, string> = {
        sold_out: "Marked sold out",
        restock: "Restocked",
        category: "Category updated",
        collection: "Collection updated",
        publish: "Published",
        unpublish: "Unpublished",
      };
      setMsg(`${labels[action] || "Updated"} · ${data.updated ?? selected.length} product(s)`);
      setSelected([]);
      await load();
    }, "Updating products…");
  }

  async function markSoldOut(id: string) {
    await withBusy(async () => {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action: "sold_out" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Marked sold out");
      await load();
    }, "Marking sold out…");
  }

  async function remove(id: string) {
    if (!confirm("Delete this product from the live catalogue?")) return;
    await withBusy(async () => {
      await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      await load();
    }, "Deleting…");
  }

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
            Select products to bulk mark sold out, change category, or delete.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="h-11 w-48 border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent sm:w-56"
          />
          <button
            type="button"
            onClick={toggleAllFiltered}
            className="h-11 border border-mkos-border px-4 font-display text-[10px] tracking-[0.16em] uppercase"
          >
            {allFilteredSelected ? "Clear selection" : "Select all"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="h-11 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase"
          >
            New product
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-mkos-accent">{msg}</p>}

      {selected.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-col gap-3 border border-mkos-border bg-white p-4 shadow-lg sm:flex-row sm:flex-wrap sm:items-center">
          <p className="font-display text-[11px] tracking-[0.16em] text-mkos-ink uppercase">
            {selected.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => bulkAction("sold_out")}
              className="h-9 bg-mkos-ink px-3 font-display text-[9px] tracking-[0.14em] text-white uppercase"
            >
              Mark sold out
            </button>
            <button
              type="button"
              onClick={() => bulkAction("restock", "10")}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
            >
              Restock (10)
            </button>
            <button
              type="button"
              onClick={() => bulkAction("publish")}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => bulkAction("unpublish")}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
            >
              Unpublish
            </button>
            <button
              type="button"
              onClick={() => bulkAction("delete")}
              className="h-9 px-3 font-display text-[9px] tracking-[0.14em] text-red-600 uppercase"
            >
              Delete
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="h-9 border border-mkos-border bg-white px-2 text-xs"
            >
              <option value="women-rtw">Women’s RTW</option>
              <option value="men-rtw">Men’s RTW</option>
              <option value="women-bespoke">Women’s Bespoke</option>
              <option value="men-bespoke">Men’s Bespoke</option>
              <option value="aso-ebi">Aso Ebi</option>
              <option value="occasion">Occasion Wear</option>
              <option value="registry-gowns">Registry Gowns</option>
              <option value="reception">Reception Dresses</option>
              <option value="bridesmaids">Bridesmaids</option>
              <option value="grooms">Grooms</option>
              <option value="bridal-party">Family & Bridal Party</option>
            </select>
            <button
              type="button"
              onClick={() => bulkAction("category", bulkCategory)}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
            >
              Set category
            </button>
            <select
              value={bulkCollection}
              onChange={(e) => setBulkCollection(e.target.value)}
              className="h-9 border border-mkos-border bg-white px-2 text-xs"
            >
              <option value="ready-to-wear">Ready-to-Wear</option>
              <option value="bespoke">Bespoke</option>
              <option value="bridal">Bridal</option>
            </select>
            <button
              type="button"
              onClick={() => bulkAction("collection", bulkCollection)}
              className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
            >
              Set collection
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-mkos-muted">Loading catalogue…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const isSelected = selected.includes(p.id);
            const soldOut = Number(p.stock) <= 0;
            return (
              <div
                key={p.id}
                className={cn(
                  "border bg-white transition-shadow",
                  isSelected ? "border-mkos-accent shadow-[0_0_0_1px_#c45c26]" : "border-mkos-border"
                )}
              >
                <div className="relative aspect-[4/5] bg-mkos-warm">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-mkos-muted">
                      No image
                    </div>
                  )}
                  <label className="absolute top-3 left-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/95 shadow">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 accent-mkos-accent"
                      aria-label={`Select ${p.name}`}
                    />
                  </label>
                  {soldOut && (
                    <span className="absolute top-3 right-3 z-10 bg-mkos-ink px-2 py-1 font-display text-[9px] tracking-[0.14em] text-white uppercase">
                      Sold out
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg tracking-tight">{p.name}</p>
                      <p className="text-xs text-mkos-muted">
                        {p.slug}
                        {p.category_slug ? ` · ${p.category_slug}` : ""}
                      </p>
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
                    {formatPrice(Number(p.price))} ·{" "}
                    {soldOut ? (
                      <span className="text-mkos-accent">Sold out</span>
                    ) : (
                      <>Stock {p.stock}</>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="h-9 bg-mkos-ink px-3 font-display text-[9px] tracking-[0.16em] text-white uppercase"
                    >
                      Edit
                    </button>
                    {!soldOut && (
                      <button
                        type="button"
                        onClick={() => markSoldOut(p.id)}
                        className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.16em] uppercase"
                      >
                        Sold out
                      </button>
                    )}
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
            );
          })}
        </div>
      )}

      {!loading && !filtered.length && (
        <p className="text-sm text-mkos-muted">No products found. Create one to get started.</p>
      )}

      {editing && (
        <ProductDraftsModal
          drafts={drafts}
          msg={msg}
          onClose={() => setEditing(false)}
          onSubmit={saveProduct}
          onAdd={addDraft}
          onRemove={removeDraft}
          onChange={updateDraft}
          onUpload={uploadImage}
          onAi={aiFillField}
        />
      )}
    </div>
  );
}
