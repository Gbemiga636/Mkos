"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageFocusEditor } from "@/components/admin/ImageFocusEditor";
import {
  DEFAULT_IMAGE_FOCUS,
  objectPositionCss,
  type ImageFocus,
} from "@/lib/media/imageFocus";

export type ProductDraft = {
  id: string;
  name: string;
  slug: string;
  price: string;
  priceUsd: string;
  stock: string;
  tagline: string;
  description: string;
  story: string;
  material: string;
  collection: string;
  category: string;
  images: string[];
  imageFocus: ImageFocus[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  trending: boolean;
  isPublished: boolean;
  sizingMode: "size" | "length";
  sizingNote: string;
  sizes: string;
  colors: string;
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

  const [focusEdit, setFocusEdit] = useState<{ draftIndex: number; imageIndex: number } | null>(
    null
  );

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
              {!editingSingle && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                    Product {index + 1}
                  </p>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="font-display text-[10px] tracking-[0.16em] text-red-600 uppercase"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Name
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => onChange(index, { name: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Price ($ USD)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.priceUsd}
                    onChange={(e) => onChange(index, { priceUsd: e.target.value })}
                    placeholder="e.g. 120.00"
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  />
                  <p className="mt-1.5 text-xs text-mkos-muted">
                    Catalogue and checkout are USD-only (Stripe).
                  </p>
                </label>

                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Stock
                  </span>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => onChange(index, { stock: e.target.value })}
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  />
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
                    <option value="women-rtw">Women’s style</option>
                    <option value="men-rtw">Men’s style</option>
                    <option value="boubou">Boubou</option>
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Tagline
                  </span>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      value={form.tagline}
                      onChange={(e) => onChange(index, { tagline: e.target.value })}
                      className="h-11 flex-1 border border-mkos-border bg-white px-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onAi(index, "tagline")}
                      className="h-11 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                    >
                      AI
                    </button>
                  </div>
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Description
                  </span>
                  <div className="mt-1.5 space-y-2">
                    <textarea
                      value={form.description}
                      onChange={(e) => onChange(index, { description: e.target.value })}
                      rows={3}
                      className="w-full border border-mkos-border bg-white px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onAi(index, "description")}
                      className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                    >
                      AI description
                    </button>
                  </div>
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Story
                  </span>
                  <div className="mt-1.5 space-y-2">
                    <textarea
                      value={form.story}
                      onChange={(e) => onChange(index, { story: e.target.value })}
                      rows={3}
                      className="w-full border border-mkos-border bg-white px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onAi(index, "story")}
                      className="h-9 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
                    >
                      AI story
                    </button>
                  </div>
                </label>

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

                <div className="sm:col-span-2">
                  <p className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Fitting options
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onChange(index, {
                          sizingMode: "size",
                          sizes:
                            form.sizingMode === "size"
                              ? form.sizes
                              : form.sizes || "XS, S, M, L, XL",
                        })
                      }
                      className={`h-9 px-4 font-display text-[10px] tracking-[0.16em] uppercase ${
                        form.sizingMode !== "length"
                          ? "bg-mkos-ink text-white"
                          : "border border-mkos-border"
                      }`}
                    >
                      Size (XS–XL)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(index, {
                          sizingMode: "length",
                          sizingNote: form.sizingNote?.trim() || "One size fits all",
                          sizes:
                            form.sizingMode === "length"
                              ? form.sizes
                              : form.sizes || "50, 55, 60, 65",
                        })
                      }
                      className={`h-9 px-4 font-display text-[10px] tracking-[0.16em] uppercase ${
                        form.sizingMode === "length"
                          ? "bg-mkos-ink text-white"
                          : "border border-mkos-border"
                      }`}
                    >
                      Length
                    </button>
                  </div>
                </div>

                {form.sizingMode === "length" ? (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                        Length note
                      </span>
                      <input
                        value={form.sizingNote}
                        onChange={(e) => onChange(index, { sizingNote: e.target.value })}
                        placeholder="One size fits all"
                        className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                      />
                      <p className="mt-1.5 text-xs text-mkos-muted">
                        Shown above the length buttons on the product page (e.g. One size fits all).
                      </p>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                        Lengths available (comma separated)
                      </span>
                      <input
                        value={form.sizes}
                        onChange={(e) => onChange(index, { sizes: e.target.value })}
                        placeholder="50, 55, 60, 65"
                        className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                      />
                      <p className="mt-1.5 text-xs text-mkos-muted">
                        Shoppers must pick one length. Leave blank for note-only (no length choice).
                      </p>
                    </label>
                  </>
                ) : (
                  <label className="block sm:col-span-2">
                    <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                      Sizes (comma separated)
                    </span>
                    <input
                      value={form.sizes}
                      onChange={(e) => onChange(index, { sizes: e.target.value })}
                      placeholder="XS, S, M, L, XL"
                      className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                    />
                  </label>
                )}

                <label className="block sm:col-span-2">
                  <span className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase">
                    Colours (comma separated)
                  </span>
                  <input
                    value={form.colors}
                    onChange={(e) => onChange(index, { colors: e.target.value })}
                    placeholder="Leave blank for no colour choice — or Blue, Tan, Black"
                    className="mt-1.5 h-11 w-full border border-mkos-border bg-white px-3 text-sm outline-none"
                  />
                  <p className="mt-1.5 text-xs text-mkos-muted">
                    Empty = no colour on the storefront. If you add colours, shoppers must pick one.
                  </p>
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
                  <p className="mb-3 text-xs text-mkos-muted">
                    After upload, tap Position to frame the photo, then Save product so it sticks.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.images.map((src, i) => {
                      const focus = form.imageFocus?.[i] ?? DEFAULT_IMAGE_FOCUS;
                      return (
                        <div
                          key={`${src}-${i}`}
                          className="overflow-hidden border border-mkos-border bg-white"
                        >
                          <div className="relative aspect-[3/4] bg-mkos-warm">
                            <Image
                              src={src}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="160px"
                              style={{ objectPosition: objectPositionCss(focus) }}
                            />
                          </div>
                          <div className="flex border-t border-mkos-border">
                            <button
                              type="button"
                              onClick={() => setFocusEdit({ draftIndex: index, imageIndex: i })}
                              className="flex-1 py-2 font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
                            >
                              Position
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange(index, {
                                  images: form.images.filter((_, idx) => idx !== i),
                                  imageFocus: (form.imageFocus ?? []).filter((_, idx) => idx !== i),
                                })
                              }
                              className="border-l border-mkos-border px-3 py-2 font-display text-[9px] tracking-[0.14em] text-red-600 uppercase"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

      {focusEdit && drafts[focusEdit.draftIndex]?.images[focusEdit.imageIndex] && (
        <ImageFocusEditor
          src={drafts[focusEdit.draftIndex].images[focusEdit.imageIndex]}
          value={
            drafts[focusEdit.draftIndex].imageFocus?.[focusEdit.imageIndex] ?? DEFAULT_IMAGE_FOCUS
          }
          onClose={() => setFocusEdit(null)}
          onChange={(focus) => {
            const d = drafts[focusEdit.draftIndex];
            const nextFocus = [
              ...(d.imageFocus ?? d.images.map(() => ({ ...DEFAULT_IMAGE_FOCUS }))),
            ];
            while (nextFocus.length < d.images.length) nextFocus.push({ ...DEFAULT_IMAGE_FOCUS });
            nextFocus[focusEdit.imageIndex] = focus;
            onChange(focusEdit.draftIndex, { imageFocus: nextFocus });
          }}
        />
      )}
    </div>
  );
}
