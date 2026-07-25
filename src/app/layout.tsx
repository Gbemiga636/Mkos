import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/experience/Providers";
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
    default: "MKOS — Quiet Luxury Atelier",
    template: "%s · MKOS",
  },
  description:
    "MKOS is a luxury atelier of essential clothing — cinematic shopping, refined materials, and pieces designed to feel inevitable.",
  openGraph: {
    title: "MKOS — Quiet Luxury Atelier",
    description: "Enter a handcrafted luxury shopping experience.",
    images: ["/logo/mkos-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
