import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop Ready-to-Wear",
  description:
    "Shop MKoS Ready-to-Wear — women’s style, men’s style, and boubou collections. Timeless Nigerian contemporary fashion, crafted in Lagos.",
  path: "/shop",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
