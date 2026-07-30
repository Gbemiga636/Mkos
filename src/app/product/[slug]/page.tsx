import type { Metadata } from "next";
import { products } from "@/data/products";
import { getProductBySlug } from "@/lib/cms/getCms";
import { pageMetadata } from "@/lib/seo";
import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  const description =
    product.tagline ||
    product.description?.slice(0, 155) ||
    `${product.name} by MKoS — Nigerian contemporary fashion.`;

  return pageMetadata({
    title: product.name,
    description,
    path: `/product/${product.slug}`,
    images: product.images?.[0] ? [product.images[0]] : undefined,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return <ProductClient product={product} />;
}
