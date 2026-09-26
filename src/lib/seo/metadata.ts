import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_LOCALE, HREFLANG, LOCALES, OG_LOCALE, SITE_NAME, SITE_NAME_AR, SITE_URL } from "./config";

/** Absolute URL for a locale-less path, e.g. siteUrl("ar", "/store") → https://…/ar/store */
export function siteUrl(locale: Locale, path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return `${SITE_URL}/${locale}${p}`;
}

/** Canonical + UAE-only hreflang (ar-AE, en-AE, x-default → Arabic). */
export function buildAlternates(locale: Locale, path = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = siteUrl(l, path);
  languages["x-default"] = siteUrl(DEFAULT_LOCALE, path);
  return { canonical: siteUrl(locale, path), languages };
}

/** Indexable pages: let Google show large image previews and full snippets. */
const INDEX: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

export const NOINDEX: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og`;

/**
 * Share-image version of a product photo. Cloudinary photos are cropped to 1200×630 JPEG
 * (WhatsApp drops images over ~300 KB and can't show WebP/AVIF reliably).
 */
export function ogImage(url: string): { url: string; width?: number; height?: number } {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return { url };
  return { url: url.replace("/upload/", "/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:eco/"), width: 1200, height: 630 };
}

type PageMetaInput = {
  locale: Locale;
  /** Locale-less path, e.g. "/store" or "" for home. */
  path: string;
  title: string;
  description: string;
  /** Use the title as-is instead of the "%s | HomeLoop" template (home page). */
  absoluteTitle?: boolean;
  images?: { url: string; alt?: string; width?: number; height?: number; type?: string }[];
  type?: "website" | "article";
  /** Filtered/variant URLs and sold items: noindex, follow; no canonical or hreflang. */
  noindex?: boolean;
};

/**
 * One call per page for title, description, canonical, hreflang, Open Graph and
 * Twitter. Next merges metadata shallowly, so openGraph/twitter are always set in
 * full here rather than relying on the layout's values.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle,
  images,
  type = "website",
  noindex,
}: PageMetaInput): Metadata {
  const url = siteUrl(locale, path);
  const siteName = locale === "ar" ? SITE_NAME_AR : SITE_NAME;
  const ogImages = images?.length
    ? images
    : [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title, type: "image/png" }];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    // Noindexed variants get no canonical: "noindex" plus "canonical elsewhere" are conflicting signals.
    alternates: noindex ? undefined : buildAlternates(locale, path),
    robots: noindex ? NOINDEX : INDEX,
    openGraph: {
      type,
      url,
      siteName,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

/** Meta descriptions are cut at ~160 chars in results; trim on a word boundary. */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/[\u200e\u200f]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[.,;:،\s]+$/, "")}…`;
}

/** Metadata for a missing product/category: 404 page, never indexed. */
export const notFoundMetadata = (title: string): Metadata => ({ title, robots: NOINDEX });
