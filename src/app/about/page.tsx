import type { Metadata } from "next";
import { AboutPageClient } from "@/components/about/AboutPageClient";
import { EditableSection } from "@/components/cms/EditableSection";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Who we are",
  description:
    "Meet MKoS (My Kind of Style) — Nigerian contemporary fashion blending craftsmanship, African heritage, and timeless style. Studio in Oniru, Lagos.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <EditableSection cmsKey="brand_story" label="About MKoS">
      <AboutPageClient />
    </EditableSection>
  );
}
