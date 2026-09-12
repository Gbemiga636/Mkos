import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/experience/Providers";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getCmsSnapshot } from "@/lib/cms/getCms";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_FULL_NAME,
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
    default: DEFAULT_TITLE,
    template: `%s · My Kind of Style (MKoS)`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_FULL_NAME,
  keywords: [
    "My Kind of Style",
    "My Kind of Style fashion",
    "My Kind of Style Lagos",
    "MKoS",
    "MKoS fashion",
    "EmKos",
    "Nigerian fashion",
    "Lagos fashion",
    "Ready-to-Wear Nigeria",
    "bespoke fashion Lagos",
    "African contemporary fashion",
    "Oniru fashion",
    "Aso Ebi",
    "bridal fashion Lagos",
  ],
  authors: [{ name: SITE_FULL_NAME, url: SITE_URL }],
  creator: SITE_FULL_NAME,
  publisher: SITE_FULL_NAME,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_FULL_NAME,
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: absoluteUrl("/logo/mkos-logo.png"),
        width: 1200,
        height: 630,
        alt: "My Kind of Style (MKoS) — Nigerian contemporary fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
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
        name: "My Kind of Style",
        legalName: "My Kind of Style",
        alternateName: ["MKoS", "My Kind of Style", "EmKos", "Em-Kos"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/logo/mkos-icon-512.png"),
          width: 512,
          height: 512,
        },
        image: absoluteUrl("/logo/mkos-logo.png"),
        email: "styleme@mykindofstyle.com",
        sameAs: [
          "https://www.instagram.com/shopmykindofstyle",
          "https://www.instagram.com/mkosformen",
        ],
      },
      {
        "@type": "ClothingStore",
        "@id": `${SITE_URL}/#store`,
        name: "My Kind of Style",
        alternateName: ["MKoS", "My Kind of Style"],
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
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "My Kind of Style",
        alternateName: ["MKoS", "My Kind of Style (MKoS)"],
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-NG",
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
