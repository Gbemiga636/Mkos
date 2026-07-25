import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog";
import { ScrollReveal } from "@/components/experience/ScrollReveal";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Journal" };
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const paragraphs = (post.body || "").split(/\n\n+/).filter(Boolean);

  return (
    <article className="bg-white pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <ScrollReveal y={20}>
          <Link
            href="/blog"
            className="font-display text-[10px] tracking-[0.28em] text-mkos-muted uppercase"
          >
            ← Journal
          </Link>
        </ScrollReveal>
        <ScrollReveal y={28} delay={40}>
          <p className="mt-8 font-display text-[11px] tracking-[0.3em] text-mkos-accent uppercase">
            {post.author_name || "MKOS"}
            {post.published_at
              ? ` · ${new Date(post.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
            {post.reading_time ? ` · ${post.reading_time} min read` : ""}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-6 text-lg leading-relaxed text-mkos-muted">{post.excerpt}</p>
          )}
        </ScrollReveal>
      </div>

      {post.cover_image && (
        <ScrollReveal y={40} delay={80} className="mx-auto mt-12 max-w-[1100px] px-5 sm:px-8">
          <div className="relative aspect-[16/9] overflow-hidden bg-mkos-warm">
            <Image
              src={post.cover_image}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1100px) 100vw, 1100px"
            />
          </div>
        </ScrollReveal>
      )}

      <div className="mx-auto mt-12 max-w-3xl space-y-6 px-5 sm:px-8">
        {paragraphs.map((p, i) => (
          <ScrollReveal key={i} y={20} delay={Math.min(i * 40, 200)}>
            <p className="text-base leading-[1.8] text-mkos-ink/90 sm:text-lg">{p}</p>
          </ScrollReveal>
        ))}

        {!!post.tags.length && (
          <div className="flex flex-wrap gap-2 border-t border-mkos-border pt-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="border border-mkos-border px-3 py-1 font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-10">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center bg-mkos-ink px-6 font-display text-[11px] tracking-[0.22em] text-white uppercase"
          >
            Shop the collection
          </Link>
        </div>
      </div>
    </article>
  );
}
