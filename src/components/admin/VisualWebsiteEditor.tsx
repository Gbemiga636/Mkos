"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBusyStore } from "@/store/busy";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/media/clientUpload";

type Block = {
  key: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  eyebrow: string | null;
  cta_label: string | null;
  cta_href: string | null;
  media_url: string | null;
  media_type: string | null;
  extra?: Record<string, unknown>;
};

type CarouselRow = {
  id: string;
  name: string;
  image_url: string;
  href: string | null;
  sort_order: number;
  is_published: boolean;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
};

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  is_published: boolean;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  featured: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  trending: boolean;
  is_published: boolean;
  price: number;
};

type ReviewRow = {
  id: string;
  author_name: string;
  location: string | null;
  rating: number;
  body: string;
  product_name: string | null;
  sort_order: number;
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

type Assets = {
  carousel: CarouselRow[];
  categories: CategoryRow[];
  collections: CollectionRow[];
  products: ProductRow[];
  reviews: ReviewRow[];
  faqs: FaqRow[];
};

const PAGES = [
  {
    id: "home",
    label: "Home",
    path: "/",
    keys: [
      "hero",
      "campaign",
      "editorial",
      "featured_video",
      "featured_collections",
      "new_arrivals",
      "best_sellers",
      "carousel",
      "categories",
      "reviews",
      "instagram",
      "faq",
      "footer",
      "marquee",
    ],
  },
  {
    id: "about",
    label: "About",
    path: "/about",
    keys: ["brand_story", "footer"],
  },
  {
    id: "shop",
    label: "Shop",
    path: "/shop",
    keys: ["shop", "footer"],
  },
  {
    id: "experience",
    label: "Experience",
    path: "/experience",
    keys: ["experience_video", "footer"],
  },
  {
    id: "bespoke",
    label: "Bespoke",
    path: "/bespoke",
    keys: ["bespoke_video", "footer"],
  },
] as const;

const PRODUCT_FLAG: Record<string, keyof ProductRow> = {
  new_arrivals: "new_arrival",
  trending: "trending",
  best_sellers: "best_seller",
};

async function uploadFile(file: File, alt = ""): Promise<string> {
  const data = await uploadMediaFile(file, { folder: "cms", alt });
  if (!data.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

function Thumb({ src, video }: { src?: string | null; video?: boolean }) {
  if (!src) {
    return (
      <div className="flex h-16 w-16 items-center justify-center bg-mkos-warm text-[9px] text-mkos-muted">
        Empty
      </div>
    );
  }
  if (video || /\.(mp4|webm|mov)(\?|$)/i.test(src)) {
    return <video src={src} className="h-16 w-16 object-cover" muted />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-16 w-16 object-cover" />;
}

export function VisualWebsiteEditor() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pageId, setPageId] = useState<(typeof PAGES)[number]["id"]>("home");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Block | null>(null);
  const [status, setStatus] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const page = PAGES.find((p) => p.id === pageId)!;
  const previewSrc = `${page.path}?mkos_edit=1`;

  const pageBlocks = useMemo(
    () => blocks.filter((b) => (page.keys as readonly string[]).includes(b.key)),
    [blocks, page.keys]
  );

  const load = useCallback(async () => {
    const [contentRes, assetsRes] = await Promise.all([
      fetch("/api/admin/content"),
      fetch("/api/admin/site-assets"),
    ]);
    const contentData = await contentRes.json();
    const assetsData = await assetsRes.json();
    setBlocks(contentData.content ?? []);
    if (assetsRes.ok) {
      setAssets({
        carousel: assetsData.carousel ?? [],
        categories: assetsData.categories ?? [],
        collections: assetsData.collections ?? [],
        products: assetsData.products ?? [],
        reviews: assetsData.reviews ?? [],
        faqs: assetsData.faqs ?? [],
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "mkos-edit-section" && e.data.key) {
        const key = String(e.data.key);
        setActiveKey(key);
        const block = blocks.find((b) => b.key === key);
        if (block) setDraft({ ...block, extra: { ...(block.extra || {}) } });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [blocks]);

  useEffect(() => {
    if (!activeKey) return;
    const block = blocks.find((b) => b.key === activeKey);
    if (block) setDraft({ ...block, extra: { ...(block.extra || {}) } });
  }, [activeKey, blocks]);

  function reloadPreview() {
    if (iframeRef.current) {
      iframeRef.current.src = `${previewSrc}&t=${Date.now()}`;
    }
  }

  async function mutateAsset(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/site-assets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    await load();
    reloadPreview();
    return data;
  }

  async function saveContent() {
    if (!draft) return;
    setStatus("");
    await withBusy(async () => {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Save failed");
        return;
      }
      setBlocks((prev) => prev.map((b) => (b.key === draft.key ? data.content : b)));
      setStatus("Saved — live on the main site");
      reloadPreview();
    }, "Saving to live site…");
  }

  async function replaceSectionMedia(file: File) {
    if (!draft) return;
    await withBusy(async () => {
      try {
        const url = await uploadFile(file, draft.title || draft.key);
        const isVideo = file.type.startsWith("video/");
        setDraft({
          ...draft,
          media_url: url,
          media_type: isVideo ? "video" : "image",
        });
        setStatus("Media ready — click Save section copy");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Upload failed");
      }
    }, "Uploading media…");
  }

  async function replaceSecondary(file: File) {
    if (!draft) return;
    await withBusy(async () => {
      try {
        const url = await uploadFile(file, "secondary");
        setDraft({
          ...draft,
          extra: { ...(draft.extra || {}), secondary_image: url },
        });
        setStatus("Secondary image ready — click Save section copy");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Upload failed");
      }
    }, "Uploading…");
  }

  const frameWidth =
    device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";

  const galleryImages = (draft?.extra?.gallery as string[] | undefined) || [];

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[640px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Website editor
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
            Edit the live site
          </h1>
          <p className="mt-2 max-w-xl text-sm text-mkos-muted">
            Click any section, then replace or delete every picture, video, or product in it.
            Save publishes to the main site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPageId(p.id);
                setActiveKey(null);
                setDraft(null);
                setStatus("");
              }}
              className={cn(
                "h-10 px-4 font-display text-[10px] tracking-[0.18em] uppercase",
                pageId === p.id
                  ? "bg-mkos-ink text-white"
                  : "border border-mkos-border text-mkos-muted hover:text-mkos-ink"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-mkos-border bg-white px-3 py-2">
        <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
          Preview
        </span>
        {(["desktop", "tablet", "mobile"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={cn(
              "h-8 px-3 font-display text-[9px] tracking-[0.14em] uppercase",
              device === d ? "bg-mkos-warm text-mkos-ink" : "text-mkos-muted"
            )}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={reloadPreview}
          className="ml-auto h-8 border border-mkos-border px-3 font-display text-[9px] tracking-[0.14em] uppercase"
        >
          Refresh
        </button>
        <a
          href={page.path}
          target="_blank"
          rel="noreferrer"
          className="h-8 border border-mkos-border px-3 font-display text-[9px] leading-8 tracking-[0.14em] uppercase"
        >
          Open live
        </a>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex min-h-0 justify-center overflow-hidden border border-mkos-border bg-mkos-warm/50 p-3">
          <div
            className="h-full overflow-hidden border border-mkos-border bg-white shadow-xl transition-all"
            style={{ width: frameWidth, maxWidth: "100%" }}
          >
            <iframe
              key={`${pageId}-${device}`}
              ref={iframeRef}
              title="MKoS preview"
              src={previewSrc}
              className="h-full w-full bg-white"
            />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col border border-mkos-border bg-white">
          <div className="border-b border-mkos-border px-4 py-3">
            <p className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              Sections on this page
            </p>
            <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
              {pageBlocks.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => {
                    setActiveKey(b.key);
                    setDraft({ ...b, extra: { ...(b.extra || {}) } });
                  }}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left font-display text-[10px] tracking-[0.12em] uppercase",
                    activeKey === b.key
                      ? "bg-mkos-ink text-white"
                      : "text-mkos-muted hover:bg-mkos-warm"
                  )}
                >
                  {b.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {!draft ? (
              <p className="text-sm text-mkos-muted">
                Click a highlighted section in the preview, or pick a section from the list.
              </p>
            ) : (
              <>
                <p className="font-display text-lg tracking-tight">{draft.key}</p>

                {(
                  [
                    ["eyebrow", "Eyebrow"],
                    ["title", "Title"],
                    ["subtitle", "Subtitle"],
                    ["cta_label", "Button label"],
                    ["cta_href", "Button link"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
                      {label}
                    </span>
                    <input
                      value={(draft[key] as string) || ""}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      className="mt-1 h-10 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
                    Body
                  </span>
                  <textarea
                    value={draft.body || ""}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    className="mt-1 min-h-24 w-full border border-mkos-border px-3 py-2 text-sm outline-none focus:border-mkos-accent"
                  />
                </label>

                {/* Single section media (hero, campaign, editorial, etc.) */}
                {!["carousel", "categories", "featured_collections", "new_arrivals", "trending", "best_sellers", "reviews", "faq", "instagram", "marquee"].includes(
                  draft.key
                ) && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
                        Section image / video
                      </span>
                      <div className="flex gap-3">
                        <label className="cursor-pointer font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase">
                          Replace
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) replaceSectionMedia(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {draft.media_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({ ...draft, media_url: null, media_type: null })
                            }
                            className="font-display text-[9px] tracking-[0.14em] text-red-600 uppercase"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      value={draft.media_url || ""}
                      onChange={(e) => setDraft({ ...draft, media_url: e.target.value })}
                      placeholder="/images/… or /videos/…"
                      className="h-10 w-full border border-mkos-border px-3 text-sm outline-none focus:border-mkos-accent"
                    />
                    {draft.media_url && (
                      <div className="mt-2 border border-mkos-border bg-mkos-warm p-2">
                        {draft.media_type === "video" ||
                        draft.media_url.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                          <video
                            src={draft.media_url}
                            className="max-h-32 w-full object-cover"
                            muted
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={draft.media_url}
                            alt=""
                            className="max-h-32 w-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* About secondary image */}
                {draft.key === "brand_story" && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
                        Story side image
                      </span>
                      <label className="cursor-pointer font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) replaceSecondary(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    {(draft.extra?.secondary_image as string) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(draft.extra?.secondary_image)}
                        alt=""
                        className="max-h-28 w-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Instagram gallery */}
                {draft.key === "instagram" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
                        Gallery pictures
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const gallery = [...galleryImages, ""];
                          setDraft({
                            ...draft,
                            extra: { ...(draft.extra || {}), gallery },
                          });
                        }}
                        className="font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
                      >
                        + Add slot
                      </button>
                    </div>
                    {(galleryImages.length
                      ? galleryImages
                      : assets?.products.slice(0, 6).map((p) => p.images?.[0] || "") || []
                    ).map((src, i) => (
                      <div
                        key={`g-${i}`}
                        className="flex items-center gap-2 border border-mkos-border p-2"
                      >
                        <Thumb src={src} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <input
                            value={galleryImages[i] ?? src}
                            onChange={(e) => {
                              const gallery = [
                                ...(galleryImages.length
                                  ? galleryImages
                                  : assets?.products.slice(0, 6).map((p) => p.images?.[0] || "") ||
                                    []),
                              ];
                              gallery[i] = e.target.value;
                              setDraft({
                                ...draft,
                                extra: { ...(draft.extra || {}), gallery },
                              });
                            }}
                            className="h-8 w-full truncate border border-mkos-border px-2 text-xs"
                          />
                          <div className="flex gap-2">
                            <label className="cursor-pointer font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
                              Replace
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !draft) return;
                                  const seeded = galleryImages.length
                                    ? [...galleryImages]
                                    : assets?.products
                                        .slice(0, 6)
                                        .map((p) => p.images?.[0] || "") || [];
                                  await withBusy(async () => {
                                    const url = await uploadFile(file, `gallery-${i}`);
                                    const gallery = [...seeded];
                                    while (gallery.length <= i) gallery.push("");
                                    gallery[i] = url;
                                    setDraft({
                                      ...draft,
                                      extra: { ...(draft.extra || {}), gallery },
                                    });
                                    setStatus("Gallery image ready — click Save section copy");
                                  }, "Uploading…");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const base = galleryImages.length
                                  ? galleryImages
                                  : assets?.products.slice(0, 6).map((p) => p.images?.[0] || "") ||
                                    [];
                                const gallery = base.filter((_, idx) => idx !== i);
                                setDraft({
                                  ...draft,
                                  extra: { ...(draft.extra || {}), gallery },
                                });
                              }}
                              className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-mkos-muted">
                      Click Save section copy to publish gallery changes.
                    </p>
                  </div>
                )}

                {/* Carousel slides */}
                {draft.key === "carousel" && assets && (
                  <AssetList
                    title="Carousel pictures"
                    onAdd={async () => {
                      await withBusy(async () => {
                        await mutateAsset({
                          kind: "carousel",
                          action: "upsert",
                          item: {
                            name: "New slide",
                            image_url: "/images/products/abeni-boubou.jpg",
                            href: "/shop",
                            sort_order: assets.carousel.length,
                          },
                        });
                        setStatus("Slide added");
                      }, "Adding slide…");
                    }}
                  >
                    {assets.carousel.map((slide) => (
                      <div
                        key={slide.id}
                        className="space-y-2 border border-mkos-border p-2"
                      >
                        <div className="flex gap-2">
                          <Thumb src={slide.image_url} />
                          <div className="min-w-0 flex-1 space-y-1">
                            <input
                              defaultValue={slide.name}
                              onBlur={async (e) => {
                                if (e.target.value === slide.name) return;
                                await withBusy(
                                  () =>
                                    mutateAsset({
                                      kind: "carousel",
                                      item: { ...slide, name: e.target.value },
                                    }),
                                  "Saving…"
                                );
                                setStatus("Slide updated");
                              }}
                              className="h-8 w-full border border-mkos-border px-2 text-xs"
                            />
                            <input
                              defaultValue={slide.href || ""}
                              onBlur={async (e) => {
                                if ((e.target.value || null) === slide.href) return;
                                await withBusy(
                                  () =>
                                    mutateAsset({
                                      kind: "carousel",
                                      item: { ...slide, href: e.target.value || null },
                                    }),
                                  "Saving…"
                                );
                                setStatus("Link updated");
                              }}
                              placeholder="Link"
                              className="h-8 w-full border border-mkos-border px-2 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <label className="cursor-pointer font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
                            Replace picture
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await withBusy(async () => {
                                  const url = await uploadFile(file, slide.name);
                                  await mutateAsset({
                                    kind: "carousel",
                                    item: { ...slide, image_url: url },
                                  });
                                  setStatus("Picture replaced");
                                }, "Replacing…");
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={async () => {
                              await withBusy(async () => {
                                await mutateAsset({
                                  kind: "carousel",
                                  action: "delete",
                                  id: slide.id,
                                });
                                setStatus("Slide deleted");
                              }, "Deleting…");
                            }}
                            className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </AssetList>
                )}

                {/* Categories */}
                {draft.key === "categories" && assets && (
                  <AssetList title="Categories (within collections)">
                    <button
                      type="button"
                      onClick={async () => {
                        const name = window.prompt("New category name (e.g. Women’s Bespoke)");
                        if (!name?.trim()) return;
                        const slug =
                          window.prompt(
                            "Slug (lowercase, hyphens)",
                            name
                              .trim()
                              .toLowerCase()
                              .replace(/['']/g, "")
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-+|-+$/g, "")
                          ) || "";
                        if (!slug.trim()) return;
                        await withBusy(async () => {
                          await mutateAsset({
                            kind: "category",
                            item: {
                              name: name.trim(),
                              slug: slug.trim(),
                              description: "",
                              image_url: null,
                            },
                          });
                          setStatus("Category added");
                        }, "Adding category…");
                      }}
                      className="mb-3 h-9 w-full border border-dashed border-mkos-border font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
                    >
                      + Add category
                    </button>
                    {assets.categories
                      .filter((c) => c.is_published !== false)
                      .map((cat) => (
                        <div key={cat.id} className="space-y-2 border border-mkos-border p-2">
                          <div className="flex gap-2">
                            <Thumb src={cat.image_url} />
                            <div className="min-w-0 flex-1 space-y-1">
                              <input
                                defaultValue={cat.name}
                                onBlur={async (e) => {
                                  if (e.target.value === cat.name) return;
                                  await withBusy(
                                    () =>
                                      mutateAsset({
                                        kind: "category",
                                        item: { ...cat, name: e.target.value },
                                      }),
                                    "Saving…"
                                  );
                                  setStatus("Category updated");
                                }}
                                className="w-full border border-mkos-border px-2 py-1 font-display text-xs"
                              />
                              <p className="text-[10px] text-mkos-muted">{cat.slug}</p>
                              <textarea
                                defaultValue={cat.description || ""}
                                onBlur={async (e) => {
                                  if (e.target.value === (cat.description || "")) return;
                                  await withBusy(
                                    () =>
                                      mutateAsset({
                                        kind: "category",
                                        item: { ...cat, description: e.target.value },
                                      }),
                                    "Saving…"
                                  );
                                  setStatus("Category updated");
                                }}
                                className="min-h-12 w-full border border-mkos-border px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <label className="cursor-pointer font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
                              Replace picture
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await withBusy(async () => {
                                    const url = await uploadFile(file, cat.name);
                                    await mutateAsset({
                                      kind: "category",
                                      item: { ...cat, image_url: url },
                                    });
                                    setStatus("Picture replaced");
                                  }, "Replacing…");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                await withBusy(async () => {
                                  await mutateAsset({
                                    kind: "category",
                                    action: "delete",
                                    id: cat.id,
                                  });
                                  setStatus("Category hidden");
                                }, "Hiding…");
                              }}
                              className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </AssetList>
                )}

                {/* Collections */}
                {draft.key === "featured_collections" && assets && (
                  <AssetList title="Collections (Ready-to-Wear · Bespoke · Bridal)">
                    <button
                      type="button"
                      onClick={async () => {
                        const name = window.prompt("New collection name (e.g. Bespoke)");
                        if (!name?.trim()) return;
                        const slug =
                          window.prompt(
                            "Slug (lowercase, hyphens)",
                            name
                              .trim()
                              .toLowerCase()
                              .replace(/['']/g, "")
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-+|-+$/g, "")
                          ) || "";
                        if (!slug.trim()) return;
                        await withBusy(async () => {
                          await mutateAsset({
                            kind: "collection",
                            item: {
                              name: name.trim(),
                              slug: slug.trim(),
                              description: "",
                              image_url: null,
                            },
                          });
                          setStatus("Collection added");
                        }, "Adding collection…");
                      }}
                      className="mb-3 h-9 w-full border border-dashed border-mkos-border font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
                    >
                      + Add collection
                    </button>
                    {assets.collections
                      .filter((c) => c.is_published !== false)
                      .map((col) => (
                        <div key={col.id} className="space-y-2 border border-mkos-border p-2">
                          <div className="flex gap-2">
                            <Thumb src={col.video_url || col.image_url} video={!!col.video_url} />
                            <div className="min-w-0 flex-1 space-y-1">
                              <input
                                defaultValue={col.name}
                                onBlur={async (e) => {
                                  if (e.target.value === col.name) return;
                                  await withBusy(
                                    () =>
                                      mutateAsset({
                                        kind: "collection",
                                        item: { ...col, name: e.target.value },
                                      }),
                                    "Saving…"
                                  );
                                  setStatus("Collection updated");
                                }}
                                className="h-8 w-full border border-mkos-border px-2 text-xs"
                              />
                              <textarea
                                defaultValue={col.description || ""}
                                onBlur={async (e) => {
                                  if (e.target.value === (col.description || "")) return;
                                  await withBusy(
                                    () =>
                                      mutateAsset({
                                        kind: "collection",
                                        item: { ...col, description: e.target.value },
                                      }),
                                    "Saving…"
                                  );
                                  setStatus("Description updated");
                                }}
                                className="min-h-12 w-full border border-mkos-border px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
                              Replace image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await withBusy(async () => {
                                    const url = await uploadFile(file, col.name);
                                    await mutateAsset({
                                      kind: "collection",
                                      item: { ...col, image_url: url, video_url: null },
                                    });
                                    setStatus("Image replaced");
                                  }, "Replacing…");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <label className="cursor-pointer font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
                              Replace video
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await withBusy(async () => {
                                    const url = await uploadFile(file, col.name);
                                    await mutateAsset({
                                      kind: "collection",
                                      item: { ...col, video_url: url },
                                    });
                                    setStatus("Video replaced");
                                  }, "Replacing…");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                await withBusy(async () => {
                                  await mutateAsset({
                                    kind: "collection",
                                    action: "delete",
                                    id: col.id,
                                  });
                                  setStatus("Collection hidden");
                                }, "Hiding…");
                              }}
                              className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </AssetList>
                )}

                {/* Product rails */}
                {PRODUCT_FLAG[draft.key] && assets && (
                  <ProductRailEditor
                    flag={PRODUCT_FLAG[draft.key]}
                    products={assets.products}
                    onChange={async (item) => {
                      await withBusy(async () => {
                        await mutateAsset({ kind: "product", item });
                        setStatus("Section updated");
                      }, "Updating…");
                    }}
                    onReplaceProduct={async (current, next) => {
                      await withBusy(async () => {
                        const flag = PRODUCT_FLAG[draft.key];
                        await mutateAsset({
                          kind: "product",
                          item: { ...current, [flag]: false },
                        });
                        await mutateAsset({
                          kind: "product",
                          item: { ...next, [flag]: true },
                        });
                        setStatus(`Replaced with ${next.name}`);
                      }, "Replacing product…");
                    }}
                  />
                )}

                {/* Reviews */}
                {draft.key === "reviews" && assets && (
                  <AssetList
                    title="Reviews"
                    onAdd={async () => {
                      await withBusy(async () => {
                        await mutateAsset({
                          kind: "review",
                          item: {
                            author_name: "New client",
                            location: "Lagos",
                            rating: 5,
                            body: "Write the review here…",
                            product_name: "",
                            sort_order: assets.reviews.length,
                          },
                        });
                        setStatus("Review added");
                      }, "Adding…");
                    }}
                  >
                    {assets.reviews.map((r) => (
                      <div key={r.id} className="space-y-1 border border-mkos-border p-2">
                        <input
                          defaultValue={r.author_name}
                          onBlur={async (e) => {
                            if (e.target.value === r.author_name) return;
                            await withBusy(
                              () =>
                                mutateAsset({
                                  kind: "review",
                                  item: { ...r, author_name: e.target.value },
                                }),
                              "Saving…"
                            );
                          }}
                          className="h-8 w-full border border-mkos-border px-2 text-xs"
                        />
                        <textarea
                          defaultValue={r.body}
                          onBlur={async (e) => {
                            if (e.target.value === r.body) return;
                            await withBusy(
                              () =>
                                mutateAsset({
                                  kind: "review",
                                  item: { ...r, body: e.target.value },
                                }),
                              "Saving…"
                            );
                          }}
                          className="min-h-16 w-full border border-mkos-border px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await withBusy(async () => {
                              await mutateAsset({
                                kind: "review",
                                action: "delete",
                                id: r.id,
                              });
                              setStatus("Review deleted");
                            }, "Deleting…");
                          }}
                          className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </AssetList>
                )}

                {/* FAQ */}
                {draft.key === "faq" && assets && (
                  <AssetList
                    title="FAQ items"
                    onAdd={async () => {
                      await withBusy(async () => {
                        await mutateAsset({
                          kind: "faq",
                          item: {
                            question: "New question?",
                            answer: "Answer…",
                            sort_order: assets.faqs.length,
                          },
                        });
                        setStatus("FAQ added");
                      }, "Adding…");
                    }}
                  >
                    {assets.faqs.map((f) => (
                      <div key={f.id} className="space-y-1 border border-mkos-border p-2">
                        <input
                          defaultValue={f.question}
                          onBlur={async (e) => {
                            if (e.target.value === f.question) return;
                            await withBusy(
                              () =>
                                mutateAsset({
                                  kind: "faq",
                                  item: { ...f, question: e.target.value },
                                }),
                              "Saving…"
                            );
                          }}
                          className="h-8 w-full border border-mkos-border px-2 text-xs"
                        />
                        <textarea
                          defaultValue={f.answer}
                          onBlur={async (e) => {
                            if (e.target.value === f.answer) return;
                            await withBusy(
                              () =>
                                mutateAsset({
                                  kind: "faq",
                                  item: { ...f, answer: e.target.value },
                                }),
                              "Saving…"
                            );
                          }}
                          className="min-h-16 w-full border border-mkos-border px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await withBusy(async () => {
                              await mutateAsset({ kind: "faq", action: "delete", id: f.id });
                              setStatus("FAQ deleted");
                            }, "Deleting…");
                          }}
                          className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </AssetList>
                )}

                {status && <p className="text-sm text-mkos-accent">{status}</p>}
              </>
            )}
          </div>

          <div className="border-t border-mkos-border p-4">
            <button
              type="button"
              disabled={!draft}
              onClick={saveContent}
              className="h-11 w-full bg-mkos-ink font-display text-[10px] tracking-[0.18em] text-white uppercase disabled:opacity-40"
            >
              Save section copy
            </button>
            <p className="mt-2 text-[10px] leading-relaxed text-mkos-muted">
              Pictures, videos &amp; products update as soon as you replace or delete them. Use
              this button for text and gallery/secondary image fields.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AssetList({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
          {title}
        </span>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="font-display text-[9px] tracking-[0.14em] text-mkos-accent uppercase"
          >
            + Add
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ProductRailEditor({
  flag,
  products,
  onChange,
  onReplaceProduct,
}: {
  flag: keyof ProductRow;
  products: ProductRow[];
  onChange: (item: ProductRow) => Promise<void>;
  onReplaceProduct: (current: ProductRow, next: ProductRow) => Promise<void>;
}) {
  const inRail = products.filter((p) => Boolean(p[flag]) && p.is_published !== false);
  const choices = products.filter((p) => p.is_published !== false);

  return (
    <div className="space-y-3">
      <span className="font-display text-[9px] tracking-[0.16em] text-mkos-muted uppercase">
        Products in this section
      </span>
      <p className="text-[11px] text-mkos-muted">
        Use Replace product to swap this slot with another product from your catalog.
      </p>
      {inRail.map((p) => (
        <div key={p.id} className="space-y-2 border border-mkos-border p-2">
          <div className="flex gap-2">
            <Thumb src={p.images?.[0]} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xs">{p.name}</p>
              <p className="text-[10px] text-mkos-muted">/{p.slug}</p>
            </div>
          </div>
          <label className="block">
            <span className="font-display text-[8px] tracking-[0.12em] text-mkos-accent uppercase">
              Replace product
            </span>
            <select
              className="mt-1 h-9 w-full border border-mkos-border px-2 text-xs text-mkos-ink"
              value=""
              onChange={async (e) => {
                const id = e.target.value;
                if (!id || id === p.id) return;
                const next = products.find((x) => x.id === id);
                if (!next) return;
                await onReplaceProduct(p, next);
              }}
            >
              <option value="">Choose another product…</option>
              {choices
                .filter((c) => c.id !== p.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c[flag] ? " (already in section)" : ""}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onChange({ ...p, [flag]: false } as ProductRow)}
            className="font-display text-[8px] tracking-[0.12em] text-red-600 uppercase"
          >
            Remove from section
          </button>
        </div>
      ))}
      {!inRail.length && (
        <p className="text-xs text-mkos-muted">No products in this section yet — add one below.</p>
      )}
      <div>
        <p className="mb-1 font-display text-[9px] tracking-[0.14em] text-mkos-muted uppercase">
          Add a product
        </p>
        <select
          className="h-9 w-full border border-mkos-border px-2 text-xs text-mkos-ink"
          value=""
          onChange={async (e) => {
            const id = e.target.value;
            if (!id) return;
            const product = products.find((x) => x.id === id);
            if (!product) return;
            await onChange({ ...product, [flag]: true } as ProductRow);
          }}
        >
          <option value="">Choose product…</option>
          {choices
            .filter((c) => !c[flag])
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

