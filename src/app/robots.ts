import type { MetadataRoute } from "next";
import { AI_FILES, PRIVATE_CRAWL_PATHS, SITE_URL } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Explicit welcome for AI search/answer bots (a named group replaces "*" for that bot,
        // so it repeats the same disallow list).
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          // Meta AI: search index, model crawler and user-requested fetches (developers.facebook.com/docs/sharing/webmasters/web-crawlers).
          "Meta-WebIndexer",
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
        ],
        allow: ["/", ...Object.values(AI_FILES), "/.well-known/"],
        disallow: PRIVATE_CRAWL_PATHS,
      },
      {
        // Search engines and AI assistants are all welcome on public pages.
        userAgent: "*",
        allow: ["/", ...Object.values(AI_FILES), "/.well-known/"],
        disallow: PRIVATE_CRAWL_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
