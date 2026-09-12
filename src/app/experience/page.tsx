import type { Metadata } from "next";
import { ExperiencePageClient } from "@/components/mkos-experience/ExperiencePageClient";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The My Kind of Style Experience",
  description:
    "Visit the My Kind of Style (MKoS) studio in Oniru, Lagos — fittings, full glam, and the house experience in person. Plan your studio visit with MKoS.",
  path: "/experience",
});

export default function ExperiencePage() {
  return <ExperiencePageClient />;
}
