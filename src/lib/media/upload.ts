/**
 * Single server path for every media upload — always compresses, then stores in Supabase.
 */
import { createServiceClient } from "@/lib/supabase/client";
import {
  compressMediaFile,
  formatBytes,
  MAX_MEDIA_BYTES,
  sniffMimeType,
} from "@/lib/media/compress";

function safeBase(name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const base = safe.includes(".") ? safe.slice(0, safe.lastIndexOf(".")) : safe;
  return base || "file";
}

export async function uploadCompressedMedia(opts: {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
  alt?: string;
}) {
  const mime = sniffMimeType(opts.fileName, opts.mimeType);
  const compressed = await compressMediaFile(opts.file, mime, opts.fileName);
  const supabase = createServiceClient();
  const stamp = Date.now();
  const objectPath = `${opts.folder ?? "uploads"}/${stamp}-${safeBase(opts.fileName)}.${compressed.extension}`;

  const { error } = await supabase.storage.from("media").upload(objectPath, compressed.buffer, {
    contentType: compressed.mimeType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    const hint =
      error.message.includes("Bucket") || error.message.includes("not found")
        ? "Run supabase/migrations/002_media_storage.sql in the SQL Editor first."
        : undefined;
    const err = new Error(error.message) as Error & { hint?: string };
    err.hint = hint;
    throw err;
  }

  const { data } = supabase.storage.from("media").getPublicUrl(objectPath);

  await supabase.from("media_assets").insert({
    path: objectPath,
    public_url: data.publicUrl,
    kind: compressed.kind,
    mime_type: compressed.mimeType,
    original_bytes: opts.file.length,
    compressed_bytes: compressed.compressedBytes,
    width: compressed.width ?? null,
    height: compressed.height ?? null,
    alt: opts.alt ?? null,
  });

  return {
    url: data.publicUrl,
    path: objectPath,
    kind: compressed.kind,
    mimeType: compressed.mimeType,
    originalBytes: opts.file.length,
    compressedBytes: compressed.compressedBytes,
    savedBytes: Math.max(0, opts.file.length - compressed.compressedBytes),
    originalSize: formatBytes(opts.file.length),
    compressedSize: formatBytes(compressed.compressedBytes),
    underLimit: compressed.compressedBytes <= MAX_MEDIA_BYTES,
    wasCompressed: compressed.wasCompressed,
    maxBytes: MAX_MEDIA_BYTES,
  };
}
