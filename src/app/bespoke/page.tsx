import type { Metadata } from "next";
import { BespokePageClient } from "@/components/bespoke/BespokePageClient";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Bespoke & Custom Wear",
  description:
    "Begin your My Kind of Style (MKoS) bespoke atelier brief — share your event, silhouette, and services (makeup, gele, photoshoot). Custom fashion crafted in Oniru, Lagos.",
  path: "/bespoke",
});

export default function BespokePage() {
  return <BespokePageClient />;
}
