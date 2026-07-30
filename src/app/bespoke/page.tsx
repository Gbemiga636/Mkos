import type { Metadata } from "next";
import { BespokePageClient } from "@/components/bespoke/BespokePageClient";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Bespoke & Custom Wear",
  description:
    "Begin your MKoS bespoke atelier brief — share your event, silhouette, and services (makeup, gele, outfit). Custom fashion crafted in Oniru, Lagos.",
  path: "/bespoke",
});

export default function BespokePage() {
  return <BespokePageClient />;
}
