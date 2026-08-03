/**
 * Restores site_content rows touched by patch-brand-copy.ts to pre-patch shape,
 * while preserving admin media / title / secondary_image.
 * Brand Foundation storefront copy lives in code now — not CMS.
 *
 * Usage: npx tsx scripts/restore-cms-pre-brand-patch.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function restore() {
  // 1) featured_video — restore subtitle; keep media/title/CTAs from admin
  {
    const { data: row } = await sb
      .from("site_content")
      .select("*")
      .eq("key", "featured_video")
      .maybeSingle();

    const { error } = await sb.from("site_content").upsert(
      {
        key: "featured_video",
        section: "featured_video",
        title: row?.title || "MKoS in motion",
        subtitle: "A quiet look at the house — then step into the Experience.",
        eyebrow: row?.eyebrow ?? "",
        cta_label: row?.cta_label || "Enter the Experience",
        cta_href: row?.cta_href || "/experience",
        media_url: row?.media_url || "/videos/mkos-in-motion.mp4",
        media_type: row?.media_type || "video",
        extra: row?.extra ?? {},
        is_published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(`featured_video: ${error.message}`);
    console.log("✓ featured_video restored (media kept; subtitle pre-patch)");
  }

  // 2) editorial — restore lines-based philosophy block; keep admin media
  {
    const { data: row } = await sb
      .from("site_content")
      .select("*")
      .eq("key", "editorial")
      .maybeSingle();

    const { error } = await sb.from("site_content").upsert(
      {
        key: "editorial",
        section: "editorial",
        eyebrow: "Our Philosophy",
        title: null,
        body: null,
        subtitle: null,
        media_url: row?.media_url || "/images/brand/mkos-signature.jpg",
        media_type: row?.media_type || "image",
        extra: {
          lines: [
            "Timeless by design.",
            "MKoS fashion moves with time,",
            "revisiting trends with intention.",
          ],
        },
        is_published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(`editorial: ${error.message}`);
    console.log("✓ editorial restored (media kept; lines pre-patch)");
  }

  // 3) brand_story — strip foundation fields we injected; keep admin media/story
  {
    const { data: row } = await sb
      .from("site_content")
      .select("*")
      .eq("key", "brand_story")
      .maybeSingle();

    const prev = { ...((row?.extra as Record<string, unknown>) || {}) };
    delete prev.philosophy_title;
    delete prev.philosophy_body;
    delete prev.experience;
    // Keep promise/mission/vision/pillars if admin had them; storefront ignores them now.

    const { error } = await sb.from("site_content").upsert(
      {
        key: "brand_story",
        section: "brand_story",
        eyebrow: row?.eyebrow || "About MKoS",
        title: row?.title || "My Kind of Style.",
        body: row?.body ?? null,
        subtitle: row?.subtitle ?? null,
        cta_label: row?.cta_label || "Explore the shop",
        cta_href: row?.cta_href || "/shop",
        media_url: row?.media_url || "/images/products/abeni-boubou.jpg",
        media_type: row?.media_type || "image",
        extra: prev,
        is_published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(`brand_story: ${error.message}`);
    console.log("✓ brand_story: removed injected foundation fields; media/title/body kept");
  }

  console.log("\nDone. Storefront Brand Foundation copy is hard-coded in React.");
}

restore().catch((err) => {
  console.error(err);
  process.exit(1);
});
