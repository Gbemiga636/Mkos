import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/experience/Providers";
import { getCmsSnapshot } from "@/lib/cms/getCms";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mkos.studio"),
  title: {
    default: "MKoS — For Those Who Understand STYLE",
    template: "%s · MKoS",
  },
  description:
    "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand creating timeless Ready-to-Wear, Custom, Couture, and Aso Ebi for women and men.",
  openGraph: {
    title: "MKoS — For Those Who Understand STYLE",
    description:
      "Elegant, sophisticated fashion blending contemporary design with African heritage.",
    images: ["/logo/mkos-logo.png"],
  },
};

export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cms = await getCmsSnapshot();

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Providers cms={cms}>{children}</Providers>
      </body>
    </html>
  );
}
