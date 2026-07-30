import type { Metadata } from "next";
import { ExperiencePageClient } from "@/components/mkos-experience/ExperiencePageClient";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The MKoS Experience",
  description:
    "Visit the MKoS studio in Oniru, Lagos — fittings, full glam, and the house experience in person. Plan your studio visit with MKoS.",
  path: "/experience",
});

export default function ExperiencePage() {
  return <ExperiencePageClient />;
}
