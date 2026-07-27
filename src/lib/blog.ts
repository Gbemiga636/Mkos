import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/client";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  author_name: string | null;
  tags: string[];
  status: string;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapPost(row: Record<string, unknown>): BlogPost {
  const tags = row.tags;
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: row.excerpt != null ? String(row.excerpt) : null,
    body: row.body != null ? String(row.body) : null,
    cover_image: row.cover_image != null ? String(row.cover_image) : null,
    author_name: row.author_name != null ? String(row.author_name) : "MKoS",
    tags: Array.isArray(tags) ? tags.map(String) : [],
    status: String(row.status ?? "draft"),
    reading_time: row.reading_time != null ? Number(row.reading_time) : 3,
    meta_title: row.meta_title != null ? String(row.meta_title) : null,
    meta_description: row.meta_description != null ? String(row.meta_description) : null,
    published_at: row.published_at != null ? String(row.published_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export const getPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapPost(r as Record<string, unknown>));
  } catch {
    return [];
  }
});

export const getPublishedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapPost(data as Record<string, unknown>);
  } catch {
    return null;
  }
});

export function estimateReadingTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `post-${Date.now()}`
  );
}
