import type { Metadata } from "next";
import { ExperiencePageClient } from "@/components/mkos-experience/ExperiencePageClient";

export const metadata: Metadata = {
  title: "MKOS Experience",
  description:
    "Join MKOS Experience studio content, or book a Full Glam consultation — hair, makeup, gele, and outfit for your event. Studio in Oniru, Lagos.",
};

export default function ExperiencePage() {
  return <ExperiencePageClient />;
}
