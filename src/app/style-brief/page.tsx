import type { Metadata } from "next";
import { StyleBriefPageClient } from "@/components/style-brief/StyleBriefPageClient";

export const metadata: Metadata = {
  title: "Client Style Brief",
  description:
    "Share your style, event details, measurements preferences, and delivery needs so MKoS can create a piece crafted just for you.",
};

export default function StyleBriefPage() {
  return <StyleBriefPageClient />;
}
