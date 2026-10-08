import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { servicesOn, type PublicSettings } from "@/lib/api";
import { DEFAULT_LOCALE, HREFLANG, LOCALES, OG_LOCALE, SITE_NAME, SITE_NAME_AR, SITE_URL } from "./config";

/** Absolute URL for a locale-less path, e.g. siteUrl("ar", "/store") → https://…/ar/store */
export function siteUrl(locale: Locale, path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return `${SITE_URL}/${locale}${p}`;
}

/** Canonical + UAE-only hreflang (ar-AE, en-AE, x-default → English). */
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

/** Default 1200×630 share image per language: public/og-*.png, from the brand pack (src/assets/social). */
export const defaultOgImage = (locale: Locale) => `${SITE_URL}/og-${locale}.png`;

/** What the default share card actually shows: the brand lockup (its alt is not the page title). */
const DEFAULT_OG_ALT: Record<Locale, string> = {
  en: "LoopHome logo",
  ar: "شعار لوب هوم",
};

/** Cloudinary delivery URL: base, any existing transformation segments, then the version/public id. */
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?:[a-z]{1,4}_[^/]*\/)*((?:v\d+\/)?[^?]+)/;

/**
 * Share-image version of a product photo: 1200×630 JPEG, the whole item padded on the brand
 * off-white (a crop cuts the top off fridges and wardrobes). The API's own f_auto,q_auto are
 * replaced, not chained: a trailing f_auto would win and send WhatsApp WebP/AVIF, which it
 * can't show, and WhatsApp drops images over ~300 KB.
 */
export function ogImage(url: string): { url: string; width?: number; height?: number; type?: string } {
  const m = url.match(CLOUDINARY);
  if (!m) return { url };
  const id = m[2].replace(/\.[a-z0-9]+$/i, "");
  return { url: `${m[1]}c_pad,b_rgb:FAF8F5,w_1200,h_630,f_jpg,q_auto:eco/${id}.jpg`, width: 1200, height: 630, type: "image/jpeg" };
}

type PageMetaInput = {
  locale: Locale;
  /** Locale-less path, e.g. "/store" or "" for home. */
  path: string;
  title: string;
  description: string;
  /** Use the title as-is instead of the "%s | LoopHome" template (home page). */
  absoluteTitle?: boolean;
  images?: { url: string; alt?: string; width?: number; height?: number; type?: string }[];
  /** null = omit og:type (the page emits its own, e.g. "product"). */
  type?: "website" | "article" | null;
  /** Filtered/variant URLs and sold items: noindex, follow; no canonical or hreflang. */
  noindex?: boolean;
  /** Chat/social previews (WhatsApp, X…) when they should read differently from the search title. */
  socialTitle?: string;
  socialDescription?: string;
  /** Blog posts: emitted as article:* tags. */
  article?: { publishedTime: string; modifiedTime?: string; section?: string; tags?: string[]; authors?: string[] };
};

/** Google shows ~60 characters; the " | LoopHome" suffix is dropped when it would overflow or repeat the brand. */
const TITLE_MAX = 60;

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
  socialTitle = title,
  socialDescription = description,
  article,
}: PageMetaInput): Metadata {
  const url = siteUrl(locale, path);
  const siteName = locale === "ar" ? SITE_NAME_AR : SITE_NAME;
  const ogImages = images?.length
    ? images
    : [{ url: defaultOgImage(locale), width: 1200, height: 630, alt: DEFAULT_OG_ALT[locale], type: "image/png" }];
  const hasBrand = title.includes(SITE_NAME) || title.includes(SITE_NAME_AR);
  const bare = absoluteTitle || hasBrand || `${title} | ${siteName}`.length > TITLE_MAX;

  return {
    title: bare ? { absolute: title } : title,
    description,
    // Noindexed variants get no canonical: "noindex" plus "canonical elsewhere" are conflicting signals.
    alternates: noindex ? undefined : buildAlternates(locale, path),
    robots: noindex ? NOINDEX : INDEX,
    openGraph: {
      ...(type && { type }),
      ...(type === "article" &&
        article && {
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime,
          section: article.section,
          tags: article.tags,
          authors: article.authors,
        }),
      url,
      siteName,
      title: socialTitle,
      description: socialDescription,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: ogImages.map((i) => ({ url: i.url, alt: i.alt })),
    },
  };
}

/**
 * Home (and default) description; t reads "meta.home". Buying from the store only while it's open, selling to
 * LoopHome only while that's on, and only the services that are on.
 */
export function homeDescription(t: (key: string) => string, settings: PublicSettings | null) {
  const on = servicesOn(settings);
  const services = on.moving && on.technician ? "servicesBoth" : on.moving ? "servicesMoving" : on.technician ? "servicesTechnician" : null;
  const lead = on.store ? "description" : "descriptionSell";
  return [t(on.sellToUs ? lead : `${lead}List`), services && t(services)].filter(Boolean).join(" ");
}

/** The headline and metadata must describe the same current service. */
export function homeTitle(t: (key: string) => string, settings: PublicSettings | null) {
  const on = servicesOn(settings);
  return t(on.store ? "title" : on.sellToUs ? "titleSell" : "titleList");
}

/** Meta descriptions are cut at ~160 chars in results; trim on a word boundary. */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/[\u200e\u200f]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[.,;:،\s]+$/, "")}…`;
}

/** Metadata for a missing product/category: 404 page, never indexed. */
export const notFoundMetadata = (title: string): Metadata => ({ title, robots: NOINDEX });
