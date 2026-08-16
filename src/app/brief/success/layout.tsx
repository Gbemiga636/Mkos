import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Brief received",
  description: "Your MKoS brief has been received — we’ll be in touch to schedule your consultation.",
  path: "/brief/success",
  noIndex: true,
});

export default function BriefSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
