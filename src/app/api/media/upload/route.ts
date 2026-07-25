import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin/auth";
import { uploadCompressedMedia } from "@/lib/media/upload";
import { formatBytes, MAX_MEDIA_BYTES } from "@/lib/media/compress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow larger camera uploads before server-side compression. */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
    const alt = String(form.get("alt") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Hard reject absurd originals (protect compute) — still compress everything accepted
    const MAX_ORIGINAL = 80 * 1024 * 1024; // 80MB
    if (file.size > MAX_ORIGINAL) {
      return NextResponse.json(
        {
          error: `File is too large (${formatBytes(file.size)}). Max original size is ${formatBytes(MAX_ORIGINAL)} before compression.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const input = Buffer.from(arrayBuffer);

    const result = await uploadCompressedMedia({
      file: input,
      fileName: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
      folder: folder || "uploads",
      alt,
    });

    if (!result.underLimit) {
      console.warn(
        `[media] Compressed but still over ${formatBytes(MAX_MEDIA_BYTES)}: ${result.compressedSize}`
      );
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const hint = err && typeof err === "object" && "hint" in err ? String((err as { hint?: string }).hint) : undefined;
    return NextResponse.json({ error: message, hint }, { status: 500 });
  }
}
