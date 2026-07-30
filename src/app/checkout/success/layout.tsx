import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Order confirmed",
  description: "Your MKoS order confirmation.",
  path: "/checkout/success",
  noIndex: true,
});

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
