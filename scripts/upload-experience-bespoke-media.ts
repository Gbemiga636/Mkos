/**
 * Upload resized Experience/Bespoke videos to Supabase storage,
 * then update `site_content.media_url` for:
 * - experience_video
 * - bespoke_video
 *
 * Usage: npx tsx scripts/upload-experience-bespoke-media.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";

async function main() {
  // Import after dotenv config so env variables are available at module init time.
  const { uploadCompressedMedia } = await import("../src/lib/media/upload");
  const { createServiceClient } = await import("../src/lib/supabase/client");
  const sb = createServiceClient();
  const base = process.cwd();

  const items = [
    {
      key: "experience_video",
      fileName: "experience-1.mp4",
      alt: "experience_video",
    },
    {
      key: "bespoke_video",
      fileName: "bespoke-1.mp4",
      alt: "bespoke_video",
    },
  ] as const;

  for (const item of items) {
    const filePath = path.join(base, "public", "videos", item.fileName);
    const buf = await fs.readFile(filePath);

    const uploaded = await uploadCompressedMedia({
      file: buf,
      fileName: item.fileName,
      mimeType: "video/mp4",
      folder: "cms",
      alt: item.alt,
    });

    const { error } = await sb
      .from("site_content")
      .update({
        media_url: uploaded.url,
        media_type: "video",
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq("key", item.key);

    if (error) throw new Error(`site_content update (${item.key}): ${error.message}`);

    console.log(`✓ ${item.key} → ${uploaded.url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

