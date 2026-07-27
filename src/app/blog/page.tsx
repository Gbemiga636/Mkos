import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedPosts } from "@/lib/blog";
import { ScrollReveal } from "@/components/experience/ScrollReveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Journal",
  description:
    "MKoS Journal — stories on craft, style, African heritage, and the MKoS MASTER Standard.",
  openGraph: {
    title: "MKoS Journal",
    description: "Stories from the house — craft, culture, and timeless style.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal y={24}>
          <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
            Journal
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
            Stories from the house.
          </h1>
          <p className="mt-5 max-w-xl text-base text-mkos-muted sm:text-lg">
            Craft notes, style essays, and the thinking behind MKoS — written for those who
            understand STYLE.
          </p>
        </ScrollReveal>

        {!posts.length ? (
          <p className="mt-20 text-sm text-mkos-muted">
            New essays are on the way. Meanwhile, explore the{" "}
            <Link href="/about" className="underline underline-offset-4">
              MKoS MASTER Standard
            </Link>
            .
          </p>
        ) : (
          <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <ScrollReveal key={post.id} y={36} delay={i * 60}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-mkos-warm">
                    {post.cover_image ? (
                      <Image
                        src={post.cover_image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-mkos-warm to-orange-100" />
                    )}
                  </div>
                  <p className="mt-5 font-display text-[10px] tracking-[0.28em] text-mkos-muted uppercase">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Essay"}
                    {post.reading_time ? ` · ${post.reading_time} min` : ""}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-medium tracking-tight group-hover:text-mkos-accent">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mkos-muted">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
