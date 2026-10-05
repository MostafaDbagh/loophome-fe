import type { MetadataRoute } from "next";
import type { Locale } from "@/i18n/routing";
import {
  getAllProducts,
  getBlog,
  getBlogSitemap,
  getCategories,
  getSettings,
  shopEnabled,
  type BlogCard,
  type Product,
} from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/listingParams";
import {
  BLOG_CATEGORIES,
  DEFAULT_LOCALE,
  HREFLANG,
  LOCALES,
  PUBLIC_STATIC_PATHS,
  routes,
} from "@/lib/seo/config";
import { siteUrl } from "@/lib/seo/metadata";

export const revalidate = 600;

/** One entry per locale, each listing every language version (ar-AE, en-AE, x-default). */
function entries(
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = siteUrl(l, path);
  languages["x-default"] = siteUrl(DEFAULT_LOCALE, path);
  return LOCALES.map((l: Locale) => ({
    url: siteUrl(l, path),
    alternates: { languages },
    ...extra,
  }));
}

const changed = (p: Product) => new Date(p.updatedAt ?? p.publishedAt ?? 0);
/** Real last-change dates only: a lastmod that always says "now" teaches Google to ignore it. */
const newest = (list: Product[]) =>
  list.length ? new Date(Math.max(...list.map((p) => +changed(p)))) : undefined;
const newestPost = (list: BlogCard[]) => new Date(Math.max(...list.map((p) => +new Date(p.updatedAt ?? p.publishedAt))));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, settings, posts, blog] = await Promise.all([
    getCategories("en"),
    getAllProducts("en"),
    getSettings("en"),
    getBlogSitemap(),
    // Newest posts with their categories, the same list the blog index shows.
    getBlog("en", { limit: BLOG_PAGE_SIZE }),
  ]);
  const listings = new Set<string>([routes.home, routes.store]);
  const storeOn = shopEnabled(settings);
  // The API already returns no products while the store is off; categories are dropped here.
  const liveCategories = storeOn ? categories : [];

  return [
    // A store switched off by the admin 404s, so neither it nor its categories and items are listed.
    ...PUBLIC_STATIC_PATHS.filter((p) => storeOn || p.path !== routes.store).flatMap((p) =>
      entries(p.path, {
        ...(listings.has(p.path) && { lastModified: newest(products) }),
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      }),
    ),
    ...(settings?.moving?.enabled
      ? entries(routes.moving, { changeFrequency: "monthly", priority: 0.8 })
      : []),
    ...(settings?.technician?.enabled
      ? entries(routes.technician, {
          changeFrequency: "monthly",
          priority: 0.8,
        })
      : []),
    ...(settings?.pickupRental?.enabled
      ? entries(routes.pickupRental, { changeFrequency: "monthly", priority: 0.8 })
      : []),
    ...(settings?.carRecovery?.enabled
      ? entries(routes.carRecovery, { changeFrequency: "monthly", priority: 0.8 })
      : []),
    ...posts.flatMap((p) =>
      entries(routes.post(p.slug), {
        lastModified: new Date(p.updatedAt ?? p.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    // Blog categories with posts (an empty one is noindex).
    ...BLOG_CATEGORIES.flatMap((c) => {
      const inCategory = blog.items.filter((p) => p.category === c);
      return inCategory.length
        ? entries(routes.blogCategory(c), { lastModified: newestPost(inCategory), changeFrequency: "weekly", priority: 0.6 })
        : [];
    }),
    // Empty categories are noindex (thin), so they're left out until they have stock.
    ...liveCategories
      .filter((c) => products.some((p) => p.category?.slug === c.slug))
      .flatMap((c) =>
        entries(routes.category(c.slug), {
          lastModified: newest(
            products.filter((p) => p.category?.slug === c.slug),
          ),
          changeFrequency: "daily",
          priority: 0.8,
        }),
      ),
    // Sold items drop out of the public list, so only live stock is submitted.
    ...products.flatMap((p) =>
      entries(routes.product(p.slug), {
        lastModified: changed(p),
        changeFrequency: "weekly",
        priority: 0.7,
        // Next writes these into the XML unescaped.
        images: p.photos.slice(0, 5).map((ph) => ph.url.replace(/&/g, "&amp;")),
      }),
    ),
  ];
}
