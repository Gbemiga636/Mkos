import type { Metadata } from "next";
import { ExperiencePageClient } from "@/components/mkos-experience/ExperiencePageClient";

export const metadata: Metadata = {
  title: "MKoS Experience",
  description:
    "Visit the MKoS studio in Oniru, Lagos — fittings, full glam energy, and the house experience in person. Stop by or message us to plan your visit.",
};

export default function ExperiencePage() {
  return <ExperiencePageClient />;
}
