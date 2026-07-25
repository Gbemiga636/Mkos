import { products } from "@/data/products";
import { getProductBySlug } from "@/lib/cms/getCms";
import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
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
