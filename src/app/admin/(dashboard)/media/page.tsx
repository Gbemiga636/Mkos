"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useBusyStore } from "@/store/busy";
import { uploadMediaFile } from "@/lib/media/clientUpload";

type Asset = {
  id?: string;
  path?: string;
  public_url?: string;
  filename?: string;
  kind?: string;
};

export default function MediaPage() {
  const withBusy = useBusyStore((s) => s.withBusy);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets ?? []);
      }
    } catch {
      setAssets([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    await withBusy(async () => {
      const data = await uploadMediaFile(file, { folder: "admin", alt: file.name });
      if (!data.ok) {
        setMsg(data.error || "Upload failed");
        return;
      }
      setMsg(
        data.wasCompressed
          ? `Compressed ${data.originalSize} → ${data.compressedSize}`
          : "Uploaded"
      );
      await load();
    }, "Compressing & uploading…");
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
            Library
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Media</h1>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center bg-mkos-ink px-5 font-display text-[10px] tracking-[0.16em] text-white uppercase">
          Upload
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} />
        </label>
      </div>
      {msg && <p className="text-sm text-mkos-accent">{msg}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {assets.map((a, i) => (
          <div key={a.id || a.public_url || i} className="overflow-hidden border border-mkos-border bg-white">
            {a.public_url ? (
              <div className="relative aspect-square bg-mkos-warm">
                <Image src={a.public_url} alt={a.filename || ""} fill className="object-cover" sizes="200px" />
              </div>
            ) : null}
            <p className="truncate px-2 py-2 text-[11px] text-mkos-muted">{a.filename || a.path}</p>
          </div>
        ))}
      </div>
      {!assets.length && (
        <p className="text-sm text-mkos-muted">
          Upload images or videos — they compress automatically for the site.
        </p>
      )}
    </div>
  );
}
