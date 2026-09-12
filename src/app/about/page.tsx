import type { Metadata } from "next";
import { AboutPageClient } from "@/components/about/AboutPageClient";
import { EditableSection } from "@/components/cms/EditableSection";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About My Kind of Style",
  description:
    "Meet My Kind of Style (MKoS) — Nigerian contemporary fashion blending craftsmanship, African heritage, and timeless style. Studio in Oniru, Lagos.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <EditableSection cmsKey="brand_story" label="About MKoS">
      <AboutPageClient />
    </EditableSection>
  );
}
