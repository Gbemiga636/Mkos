import type { Metadata } from "next";
import { BespokePageClient } from "@/components/bespoke/BespokePageClient";

export const metadata: Metadata = {
  title: "Bespoke / Custom Wear",
  description:
    "Begin your MKoS Bespoke / Custom Wear atelier brief — share your event, silhouette, and services (makeup, gele, outfit). Crafted in Oniru, Lagos.",
};

export default function BespokePage() {
  return <BespokePageClient />;
}
