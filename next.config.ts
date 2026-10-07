import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Same default as src/lib/api.ts: the live API on Render in production, localhost in development.
const API_URL = (
  process.env.API_URL ||
  (process.env.NODE_ENV === "production" ? "https://loophome-be.onrender.com/api/v1" : "http://localhost:5000/api/v1")
).replace(/\/$/, "");

const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // The day this build was made: the "Last updated" line of /llms.txt and /llms-full.txt.
  env: { BUILD_DATE: new Date().toISOString().slice(0, 10) },
  // CSS stays a cached <link>: inlining it put ~48 KB before the share tags, past what
  // WhatsApp and other preview fetchers read of a page.
  // Bots that get metadata in <head> without streaming: Next's default list plus chat-preview and AI
  // crawlers it doesn't know (they don't run JS, so streamed tags would be invisible to them), and
  // Googlebot: on per-request pages (store/category) a slow API otherwise streams canonical and
  // hreflang into <body>, where Google ignores them.
  htmlLimitedBots: new RegExp(
    [
      String.raw`Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare`,
      String.raw`quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog`,
      String.raw`Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight`,
      String.raw`TelegramBot|Snapchat|Pinterest|Viber|Iframely|Embedly|Mastodon|Signal`,
      String.raw`GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User`,
      String.raw`MicrosoftPreview|meta-webindexer|meta-externalagent|meta-externalfetcher|meta-externalads|Cardyb`,
    ].join("|"),
    "i",
  ),
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
      // Blog slugs from before the 2026-09-29 brand rename: old links keep working.
      { source: "/:locale(en|ar)/blog/sell-vs-list-homeloop", destination: "/:locale/blog/sell-vs-list-loophome", permanent: true },
      { source: "/:locale(en|ar)/blog/how-homeloop-checks-items", destination: "/:locale/blog/how-loophome-checks-items", permanent: true },
      // skipTrailingSlashRedirect leaves root files to us: one URL each.
      { source: "/:file(llms\\.txt|llms-full\\.txt|ai\\.txt|robots\\.txt|sitemap\\.xml)/", destination: "/:file", permanent: true },
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
      // Default share images (also the blog/Organization image in JSON-LD, so they stay indexable).
      // They only change with a deploy.
      {
        source: "/og-:locale(en|ar).png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
