/**
 * Targeted CMS patch — only updates approved brand copy keys.
 * Does NOT delete or reseed unrelated admin content.
 *
 * Usage: npx tsx scripts/patch-brand-copy.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  BRAND_EXPERIENCE,
  BRAND_MISSION,
  BRAND_PHILOSOPHY_BODY,
  BRAND_PHILOSOPHY_TITLE,
  BRAND_PROMISE,
  BRAND_VISION,
  FEATURED_FILM_SUBTITLE,
  MASTER_INTRO,
  MASTER_PILLARS,
  MKoS_PILLARS,
} from "../src/lib/brand";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function patch() {
  // 1) MKoS in motion subtitle only
  {
    const { data: row } = await sb
      .from("site_content")
      .select("key, subtitle, title, media_url, media_type, eyebrow, cta_label, cta_href, extra")
      .eq("key", "featured_video")
      .maybeSingle();

    const { error } = await sb.from("site_content").upsert(
      {
        key: "featured_video",
        section: "featured_video",
        title: row?.title || "MKoS in motion",
        subtitle: FEATURED_FILM_SUBTITLE,
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
    console.log("✓ featured_video subtitle");
  }

  // 2) Our Philosophy
  {
    const { data: row } = await sb
      .from("site_content")
      .select("key, media_url, media_type, extra")
      .eq("key", "editorial")
      .maybeSingle();

    const extra = { ...((row?.extra as Record<string, unknown>) || {}) };
    delete extra.lines;

    const { error } = await sb.from("site_content").upsert(
      {
        key: "editorial",
        section: "editorial",
        eyebrow: "Our Philosophy",
        title: BRAND_PHILOSOPHY_TITLE,
        body: BRAND_PHILOSOPHY_BODY,
        media_url: row?.media_url || "/images/brand/mkos-signature.jpg",
        media_type: row?.media_type || "image",
        extra,
        is_published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(`editorial: ${error.message}`);
    console.log("✓ editorial philosophy");
  }

  // 3) About / brand_story — merge brand foundation into extra only
  {
    const { data: row } = await sb
      .from("site_content")
      .select("*")
      .eq("key", "brand_story")
      .maybeSingle();

    const prevExtra = { ...((row?.extra as Record<string, unknown>) || {}) };
    const extra = {
      ...prevExtra,
      promise: BRAND_PROMISE,
      mission: BRAND_MISSION,
      vision: BRAND_VISION,
      master_intro: MASTER_INTRO,
      philosophy_title: BRAND_PHILOSOPHY_TITLE,
      philosophy_body: BRAND_PHILOSOPHY_BODY,
      experience: BRAND_EXPERIENCE,
      mkos: [...MKoS_PILLARS],
      master: [...MASTER_PILLARS],
      values: MKoS_PILLARS.map((p) => ({
        title: `${p.letter} — ${p.title}`,
        text: p.text,
      })),
    };

    const { error } = await sb.from("site_content").upsert(
      {
        key: "brand_story",
        section: "brand_story",
        eyebrow: row?.eyebrow || "About MKoS",
        title: row?.title || "My Kind of Style.",
        body: row?.body || null,
        subtitle: row?.subtitle || null,
        cta_label: row?.cta_label || "Explore the shop",
        cta_href: row?.cta_href || "/shop",
        media_url: row?.media_url || "/images/products/abeni-boubou.jpg",
        media_type: row?.media_type || "image",
        extra,
        is_published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw new Error(`brand_story: ${error.message}`);
    console.log("✓ brand_story foundation (merged extra; kept media/title/body)");
  }

  console.log("\nDone. Only featured_video, editorial, and brand_story extras were patched.");
}

patch().catch((err) => {
  console.error(err);
  process.exit(1);
});
