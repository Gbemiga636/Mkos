import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Drop ultra-large derivatives to cut image transform + bandwidth
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "hnlhrdtsjwkythqcbmbz.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "gsap",
      "recharts",
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/react-fontawesome",
    ],
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
