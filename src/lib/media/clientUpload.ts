/**
 * Browser helper — every admin UI upload goes through /api/media/upload (always compresses).
 */
export type UploadMediaResult = {
  ok: boolean;
  url: string;
  path?: string;
  kind?: "image" | "video";
  originalSize?: string;
  compressedSize?: string;
  savedBytes?: number;
  underLimit?: boolean;
  wasCompressed?: boolean;
  error?: string;
  hint?: string;
};

export async function uploadMediaFile(
  file: File,
  opts?: { folder?: string; alt?: string }
): Promise<UploadMediaResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", opts?.folder ?? "cms");
  if (opts?.alt) fd.append("alt", opts.alt);

  const res = await fetch("/api/media/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      url: "",
      error: data.error || "Upload failed",
      hint: data.hint,
    };
  }
  return { ok: true, ...data };
}
