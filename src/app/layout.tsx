import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/experience/Providers";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getCmsSnapshot } from "@/lib/cms/getCms";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
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

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "MKoS",
    "My Kind of Style",
    "Nigerian fashion",
    "Lagos fashion",
    "Ready-to-Wear",
    "bespoke fashion",
    "African contemporary fashion",
    "Oniru",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: absoluteUrl("/logo/mkos-logo.png"),
        width: 1200,
        height: 630,
        alt: "MKoS — My Kind of Style",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl("/logo/mkos-logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  colorScheme: "light",
};

export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cms = await getCmsSnapshot();
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "MKoS",
        alternateName: ["My Kind of Style", "MKoS"],
        url: SITE_URL,
        logo: absoluteUrl("/logo/mkos-logo.png"),
        email: "styleme@mykindofstyle.com",
        sameAs: [
          "https://www.instagram.com/shopmykindofstyle",
          "https://www.instagram.com/mkosformen",
        ],
      },
      {
        "@type": "ClothingStore",
        "@id": `${SITE_URL}/#store`,
        name: "MKoS",
        url: SITE_URL,
        image: absoluteUrl("/logo/mkos-logo.png"),
        telephone: "+2348143173661",
        email: "styleme@mykindofstyle.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "1, Ade Adedeji Close, Ayo Babatunde Crescent",
          addressLocality: "Oniru",
          addressRegion: "Lagos",
          addressCountry: "NG",
        },
        areaServed: ["NG", "US", "GB"],
        priceRange: "$$",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en-NG" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <GoogleAnalytics />
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
