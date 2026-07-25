import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://mkos.studio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const staticRoutes = ["", "/shop", "/about", "/blog", "/checkout"].map((path) => ({
    url: `${site}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const blogRoutes = posts.map((p) => ({
    url: `${site}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
