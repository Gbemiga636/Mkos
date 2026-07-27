import type { Metadata } from "next";
import { AboutPageClient } from "@/components/about/AboutPageClient";
import { EditableSection } from "@/components/cms/EditableSection";

export const metadata: Metadata = {
  title: "About",
  description:
    "MKoS (My Kind of Style) — Nigerian contemporary fashion blending craftsmanship, African heritage, and timeless style. Studio in Oniru, Lagos.",
};

export default function AboutPage() {
  return (
    <EditableSection cmsKey="brand_story" label="About MKoS">
      <AboutPageClient />
    </EditableSection>
  );
}
