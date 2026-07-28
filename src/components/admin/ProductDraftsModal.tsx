"use client";

import Image from "next/image";

export type ProductDraft = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: string;
  tagline: string;
  description: string;
  story: string;
  material: string;
  collection: string;
  category: string;
  images: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  trending: boolean;
  isPublished: boolean;
  sizes: string;
};

export function ProductDraftsModal({
  drafts,
  msg,
  onClose,
  onSubmit,
  onAdd,
  onRemove,
  onChange,
  onUpload,
  onAi,
}: {
  drafts: ProductDraft[];
  msg: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<ProductDraft>) => void;
  onUpload: (file: File, index: number) => void;
  onAi: (index: number, field: "tagline" | "description" | "story" | "all") => void;
}) {
  const editingSingle = drafts.length === 1 && !!drafts[0]?.id;
  const title = editingSingle
    ? drafts[0].name || "Edit product"
    : drafts.length > 1
      ? `${drafts.length} new products`
      : "New product";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-mkos-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <form
        onSubmit={onSubmit}
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto border border-mkos-border bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-mkos-border bg-white px-5 py-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.22em] text-mkos-accent uppercase">
              {editingSingle ? "Edit product" : "Add products"}
            </p>
            <h2 className="font-display text-xl tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
          >
            Close
          </button>
        </div>

        <div className="space-y-8 p-5">
          {drafts.map((form, index) => (
            <div
              key={`draft-${index}-${form.id || "new"}`}
              className="border border-mkos-border bg-mkos-warm/30 p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-display text-[11px] tracking-[0.22em] text-mkos-accent uppercase">
                  Product {index + 1}
                  {form.name ? ` · ${form.name}` : ""}
                </p>
                {!editingSingle && drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Name
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => onChange(index, { name: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Price (NGN)
                  </span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => onChange(index, { price: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Stock / quantity
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => onChange(index, { stock: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onChange(index, { stock: "0" })}
                      className="h-8 border border-mkos-border bg-white px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                    >
                      Mark sold out
                    </button>
                    {Number(form.stock) <= 0 && (
                      <button
                        type="button"
                        onClick={() => onChange(index, { stock: "10" })}
                        className="h-8 border border-mkos-border bg-white px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                      >
                        Restock 10
                      </button>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Collection
                  </span>
                  <select
                    value={form.collection}
                    onChange={(e) => onChange(index, { collection: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  >
                    <option value="ready-to-wear">Ready-to-Wear</option>
                    <option value="bespoke">Bespoke</option>
                    <option value="bridal">Bridal</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Category
                  </span>
                  <select
                    value={form.category}
                    onChange={(e) => onChange(index, { category: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  >
                    <option value="women-rtw">Women’s RTW</option>
                    <option value="men-rtw">Men’s RTW</option>
                    <option value="boubou">Boubou</option>
                  </select>
                </label>

                <div className="block sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                      Tagline
                    </span>
                    <button
                      type="button"
                      onClick={() => onAi(index, "tagline")}
                      className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-white px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase"
                    >
                      ✦ AI
                    </button>
                  </div>
                  <input
                    value={form.tagline}
                    onChange={(e) => onChange(index, { tagline: e.target.value })}
                    className="h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none focus:border-mkos-accent"
                  />
                </div>
                <div className="block sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                      Description
                    </span>
                    <button
                      type="button"
                      onClick={() => onAi(index, "description")}
                      className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-white px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase"
                    >
                      ✦ AI
                    </button>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => onChange(index, { description: e.target.value })}
                    className="min-h-24 w-full border border-mkos-border bg-white px-3 py-2 text-sm outline-none focus:border-mkos-accent"
                  />
                </div>
                <div className="block sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                      Story
                    </span>
                    <button
                      type="button"
                      onClick={() => onAi(index, "story")}
                      className="inline-flex h-7 items-center gap-1.5 border border-mkos-border bg-white px-2.5 font-display text-[9px] tracking-[0.16em] text-mkos-accent uppercase"
                    >
                      ✦ AI
                    </button>
                  </div>
                  <textarea
                    value={form.story}
                    onChange={(e) => onChange(index, { story: e.target.value })}
                    className="min-h-24 w-full border border-mkos-border bg-white px-3 py-2 text-sm outline-none focus:border-mkos-accent"
                  />
                </div>

                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Material
                  </span>
                  <input
                    value={form.material}
                    onChange={(e) => onChange(index, { material: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Sizes (comma separated)
                  </span>
                  <input
                    value={form.sizes}
                    onChange={(e) => onChange(index, { sizes: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
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
                          if (file) onUpload(file, index);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {form.images.map((src, i) => (
                      <div
                        key={src}
                        className="group relative aspect-square border border-mkos-border bg-white"
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                        <button
                          type="button"
                          onClick={() =>
                            onChange(index, {
                              images: form.images.filter((_, idx) => idx !== i),
                            })
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
                        checked={form[key]}
                        onChange={(e) => onChange(index, { [key]: e.target.checked })}
                        className="accent-mkos-accent"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => onAi(index, "all")}
                    className="h-10 border border-mkos-border bg-white px-4 font-display text-[10px] tracking-[0.16em] uppercase"
                  >
                    ✦ AI all copy for this product
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!editingSingle && (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-14 w-full items-center justify-center gap-2 border border-dashed border-mkos-border bg-white font-display text-[11px] tracking-[0.2em] text-mkos-accent uppercase transition hover:border-mkos-accent"
            >
              <span className="text-xl leading-none">+</span>
              Add another product
            </button>
          )}
        </div>

        {msg && <p className="px-5 pb-2 text-sm text-mkos-accent">{msg}</p>}

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-mkos-border bg-white px-5 py-4">
          <button
            type="submit"
            className="h-11 flex-1 bg-mkos-ink px-5 font-display text-[10px] tracking-[0.18em] text-white uppercase sm:flex-none"
          >
            {drafts.length > 1 ? `Save all ${drafts.length} products` : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}
