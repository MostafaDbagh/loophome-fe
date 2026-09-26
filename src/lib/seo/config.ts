import { routing, type Locale } from "@/i18n/routing";

/**
 * Canonical origin, no trailing slash. Every canonical, hreflang, sitemap and og:url is
 * built from it, so a production build without it would point search engines at localhost.
 */
if (process.env.NODE_ENV === "production" && !process.env.SITE_URL) {
  throw new Error("SITE_URL must be set for production builds (e.g. https://homeloop.ae)");
}
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "HomeLoop";
export const SITE_NAME_AR = "هوم لوب";

/**
 * HomeLoop targets the UAE only, so every language tag carries the AE region
 * and nothing is emitted for other countries.
 */
export const COUNTRY = { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة" } as const;
export const UAE_CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export const HREFLANG: Record<Locale, string> = { ar: "ar-AE", en: "en-AE" };
export const OG_LOCALE: Record<Locale, string> = { ar: "ar_AE", en: "en_AE" };
export const DEFAULT_LOCALE = routing.defaultLocale;
export const LOCALES = routing.locales;

export const THEME_COLOR = "#FAF8F5";

/** Public, indexable pages. Paths are locale-less and start with "/" ("" is home). */
export const PUBLIC_STATIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/store", priority: 0.9, changeFrequency: "daily" },
  { path: "/sell", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sell/moving-out", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sell/appliances", priority: 0.7, changeFrequency: "monthly" },
  { path: "/condition-grades", priority: 0.5, changeFrequency: "yearly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;

export const routes = {
  home: "",
  store: "/store",
  category: (slug: string) => `/store/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  sell: "/sell",
  moving: "/moving",
  sellMovingOut: "/sell/moving-out",
  sellAppliances: "/sell/appliances",
  conditionGrades: "/condition-grades",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
};

/** Kept out of crawling and indexing (robots.txt + X-Robots-Tag in next.config). */
export const PRIVATE_CRAWL_PATHS = ["/api/", "/admin"];

/** LLM / AI context files, served from the site root and mirrored under /.well-known. */
export const AI_FILES = {
  llms: "/llms.txt",
  llmsFull: "/llms-full.txt",
  ai: "/ai.txt",
};
