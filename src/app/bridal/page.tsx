import type { Metadata } from "next";
import { BridalPageClient } from "@/components/bridal/BridalPageClient";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Bridal",
  description:
    "Begin your MKoS Client Bridal Brief — share your wedding vision, styling needs, and celebration details. Bespoke bridal fashion crafted in Oniru, Lagos.",
  path: "/bridal",
});

export default function BridalPage() {
  return <BridalPageClient />;
}
