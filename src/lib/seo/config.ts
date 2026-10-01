import { routing, type Locale } from "@/i18n/routing";

/**
 * Canonical origin, no trailing slash. Every canonical, hreflang, sitemap and og:url is
 * built from it, so a production build without it would point search engines at localhost.
 */
// On Vercel, falls back to the project's production domain (custom domain once attached).
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configuredUrl = process.env.SITE_URL || (vercelUrl ? `https://${vercelUrl}` : "");
// Checked on the server only: SITE_URL is a server env var, so in the browser it is always empty.
// Client components (e.g. SellForm) import `routes` from here; throwing there crashed the page.
if (typeof window === "undefined" && process.env.NODE_ENV === "production" && !configuredUrl) {
  throw new Error("SITE_URL must be set for production builds (e.g. https://loophome.ae)");
}
export const SITE_URL = (configuredUrl || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "LoopHome";
export const SITE_NAME_AR = "لوب هوم";

/**
 * LoopHome targets the UAE only, so every language tag carries the AE region
 * and nothing is emitted for other countries.
 */
export const COUNTRY = { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة" } as const;
export const UAE_CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"];

/**
 * Dubai is most of LoopHome's work; these are the communities it focuses on. `guide` is the
 * slug of the area guide on the blog (linked only once that post is published).
 */
export const DUBAI_AREAS = [
  { en: "JVC (Jumeirah Village Circle)", ar: "قرية جميرا الدائرية (JVC)", guide: "jvc-dubai-guide" },
  { en: "JVT (Jumeirah Village Triangle)", ar: "مثلث قرية جميرا (JVT)", guide: "jvt-dubai-guide" },
  { en: "JLT (Jumeirah Lake Towers)", ar: "أبراج بحيرات جميرا (JLT)", guide: "jlt-dubai-guide" },
  { en: "JBR (Jumeirah Beach Residence)", ar: "مساكن شاطئ جميرا (JBR)", guide: "jbr-dubai-guide" },
  { en: "Dubai Marina", ar: "دبي مارينا", guide: "dubai-marina-guide" },
  { en: "Al Barsha", ar: "البرشاء", guide: "al-barsha-dubai-guide" },
  { en: "Jumeirah", ar: "جميرا", guide: "jumeirah-dubai-guide" },
  { en: "Business Bay", ar: "الخليج التجاري (بزنس باي)", guide: "business-bay-dubai-guide" },
  { en: "Downtown Dubai", ar: "وسط مدينة دبي (داون تاون)", guide: "downtown-dubai-guide" },
  { en: "DIFC", ar: "مركز دبي المالي العالمي (DIFC)", guide: "difc-dubai-guide" },
  { en: "Dubai Internet City", ar: "مدينة دبي للإنترنت", guide: "dubai-internet-city-office-guide" },
  { en: "Al Furjan", ar: "الفرجان", guide: "al-furjan-dubai-guide" },
  { en: "Dubai Investment Park (DIP)", ar: "مجمع دبي للاستثمار (DIP)", guide: "dubai-investment-park-guide" },
  { en: "Arjan", ar: "أرجان", guide: "arjan-dubai-guide" },
  { en: "Dubailand", ar: "دبي لاند", guide: "dubailand-guide" },
  { en: "Dubai Sports City", ar: "مدينة دبي الرياضية", guide: "dubai-sports-city-guide" },
  { en: "Motor City", ar: "موتور سيتي", guide: "motor-city-dubai-guide" },
  { en: "Dubai Production City (IMPZ)", ar: "مدينة دبي للإنتاج (IMPZ)", guide: "dubai-production-city-guide" },
] as const;

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
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
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
  blog: "/blog",
  post: (slug: string) => `/blog/${slug}`,
  moving: "/moving",
  technician: "/technician",
  pickupRental: "/pickup-rental",
  carRecovery: "/car-recovery",
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
