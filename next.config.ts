import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const API_URL = (process.env.API_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // Small Tailwind CSS: inline it instead of a render-blocking request.
  experimental: { inlineCss: true },
  // The proxy fixes trailing slashes together with the locale in a single 308.
  skipTrailingSlashRedirect: true,
  // Don't let a CDN serve stale pages (e.g. a sold item) for long.
  expireTime: 3600,
  images: {
    // WebP only: first-time AVIF encoding was slow enough to delay LCP on new products.
    formats: ["image/webp"],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Dev data: API seed photos and FE sample items (src/lib/sample-data.ts).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    // Common typos crawlers and people try.
    return [
      { source: "/llm.txt", destination: "/llms.txt", permanent: true },
      { source: "/llm-full.txt", destination: "/llms-full.txt", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Browser forms call the API through the site origin, so no CORS setup is needed.
      { source: "/api/v1/:path*", destination: `${API_URL}/:path*` },
      // Some AI crawlers probe RFC 8615 paths; serve the same files there.
      { source: "/.well-known/llms.txt", destination: "/llms.txt" },
      { source: "/.well-known/llms-full.txt", destination: "/llms-full.txt" },
      { source: "/.well-known/ai.txt", destination: "/ai.txt" },
    ];
  },
  async headers() {
    return [
      { source: "/admin", headers: NOINDEX_HEADERS },
      { source: "/api/:path*", headers: NOINDEX_HEADERS },
      { source: "/admin/:path*", headers: NOINDEX_HEADERS },
    ];
  },
};

export default withNextIntl(nextConfig);
