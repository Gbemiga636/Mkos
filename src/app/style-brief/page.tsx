import type { Metadata } from "next";
import { StyleBriefPageClient } from "@/components/style-brief/StyleBriefPageClient";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Client Style Brief",
  description:
    "Share your style, event details, measurement preferences, and delivery needs so MKoS can create a piece crafted just for you.",
  path: "/style-brief",
});

export default function StyleBriefPage() {
  return <StyleBriefPageClient />;
}
