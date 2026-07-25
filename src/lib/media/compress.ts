import sharp from "sharp";
import { spawn } from "child_process";
import { mkdtemp, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { existsSync } from "fs";

/** Soft target for every upload (egress + storage friendly). */
export const MAX_MEDIA_BYTES = 2 * 1024 * 1024; // 2 MB
/** Images are always re-encoded; aim under this when possible. */
export const IMAGE_TARGET_BYTES = 900 * 1024; // ~900 KB

const FFMPEG_CANDIDATES = [
  process.env.FFMPEG_PATH,
  "ffmpeg",
  "C:\\Users\\HP USER\\Downloads\\ffmpeg-8.1.1-essentials_build\\ffmpeg-8.1.1-essentials_build\\bin\\ffmpeg.exe",
].filter(Boolean) as string[];

function resolveFfmpeg(): string | null {
  for (const candidate of FFMPEG_CANDIDATES) {
    if (candidate === "ffmpeg") return "ffmpeg";
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export type CompressedMedia = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalBytes: number;
  compressedBytes: number;
  width?: number;
  height?: number;
  kind: "image" | "video";
  wasCompressed: boolean;
};

/** Infer mime when browsers leave file.type empty (common on Windows). */
export function sniffMimeType(fileName: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".bmp": "image/bmp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/mp4",
    ".avi": "video/x-msvideo",
  };
  return map[ext] || mimeType || "application/octet-stream";
}

async function compressImage(input: Buffer): Promise<CompressedMedia> {
  const meta = await sharp(input, { failOn: "none" }).metadata();
  const width = meta.width;
  const height = meta.height;
  const originalBytes = input.length;

  // Always re-encode to WebP — never store raw camera PNGs/HEICs/JPEGs as-is
  let quality = 80;
  let maxEdge = Math.min(Math.max(width ?? 1920, height ?? 1920), 1920);
  let best: Buffer | null = null;
  let bestMeta: { width?: number; height?: number } = { width, height };

  for (let attempt = 0; attempt < 12; attempt++) {
    let pipeline = sharp(input, { failOn: "none" }).rotate();
    pipeline = pipeline.resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });

    const out = await pipeline.webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true });
    best = out.data;
    bestMeta = { width: out.info.width, height: out.info.height };

    const underHard = out.data.length <= MAX_MEDIA_BYTES;
    const underTarget = out.data.length <= IMAGE_TARGET_BYTES;
    if (underHard && (underTarget || quality <= 48 || maxEdge <= 1000)) {
      return {
        buffer: out.data,
        mimeType: "image/webp",
        extension: "webp",
        originalBytes,
        compressedBytes: out.data.length,
        width: out.info.width,
        height: out.info.height,
        kind: "image",
        wasCompressed: true,
      };
    }

    quality = Math.max(40, quality - 7);
    maxEdge = Math.max(800, Math.floor(maxEdge * 0.88));
  }

  const fallback = best ?? input;
  return {
    buffer: fallback,
    mimeType: "image/webp",
    extension: "webp",
    originalBytes,
    compressedBytes: fallback.length,
    width: bestMeta.width,
    height: bestMeta.height,
    kind: "image",
    wasCompressed: true,
  };
}

function runFfmpeg(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-500) || `ffmpeg exited ${code}`));
    });
  });
}

async function compressVideo(input: Buffer, originalName: string): Promise<CompressedMedia> {
  const originalBytes = input.length;
  const ffmpeg = resolveFfmpeg();

  if (!ffmpeg) {
    if (originalBytes <= MAX_MEDIA_BYTES) {
      // Can't re-encode, but still accept small videos
      return {
        buffer: input,
        mimeType: "video/mp4",
        extension: "mp4",
        originalBytes,
        compressedBytes: originalBytes,
        kind: "video",
        wasCompressed: false,
      };
    }
    throw new Error(
      "Video is over 2MB and ffmpeg was not found. Install ffmpeg or set FFMPEG_PATH so videos always compress."
    );
  }

  const dir = await mkdtemp(path.join(tmpdir(), "mkos-vid-"));
  const ext = path.extname(originalName) || ".mp4";
  const inPath = path.join(dir, `in${ext}`);
  const outPath = path.join(dir, "out.mp4");

  try {
    await writeFile(inPath, input);

    // Always re-encode for consistent size; tighten CRF until under 2MB
    const crfAttempts = originalBytes <= MAX_MEDIA_BYTES ? [26, 30, 34] : [28, 32, 36, 40, 44];
    let best: Buffer | null = null;

    for (const crf of crfAttempts) {
      await runFfmpeg(ffmpeg, [
        "-y",
        "-i",
        inPath,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        String(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-vf",
        "scale='min(1280,iw)':-2",
        outPath,
      ]);
      const out = await readFile(outPath);
      best = out;
      if (out.length <= MAX_MEDIA_BYTES) {
        return {
          buffer: out,
          mimeType: "video/mp4",
          extension: "mp4",
          originalBytes,
          compressedBytes: out.length,
          kind: "video",
          wasCompressed: true,
        };
      }
    }

    const fallback = best ?? input;
    return {
      buffer: fallback,
      mimeType: "video/mp4",
      extension: "mp4",
      originalBytes,
      compressedBytes: fallback.length,
      kind: "video",
      wasCompressed: true,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function compressMediaFile(
  input: Buffer,
  mimeType: string,
  fileName: string
): Promise<CompressedMedia> {
  const sniffed = sniffMimeType(fileName, mimeType);
  if (sniffed.startsWith("image/")) {
    return compressImage(input);
  }
  if (sniffed.startsWith("video/")) {
    return compressVideo(input, fileName);
  }
  throw new Error(`Unsupported media type: ${sniffed || mimeType}. Upload an image or video.`);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
