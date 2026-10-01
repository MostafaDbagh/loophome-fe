import { connection } from "next/server";
import type { Locale } from "@/i18n/routing";
import { SAMPLE_CATEGORIES, sampleFeed, sampleProduct, sampleSearch } from "./sample-data";

/** Server-side API root, e.g. http://localhost:5000/api/v1. Browsers use the /api/v1 rewrite instead. */
/** Cache tag on every API fetch; /api/revalidate clears it. */
export const API_CACHE_TAG = "api";

/** Production default is the live API on Render; API_URL overrides it (e.g. localhost in development). */
export const API_URL = (
  process.env.API_URL ||
  (process.env.NODE_ENV === "production" ? "https://loophome-be.onrender.com/api/v1" : "http://localhost:5000/api/v1")
).replace(/\/$/, "");

/** Dev only: when the API is down or not built yet, pages render sample items instead of empty screens. */
const USE_SAMPLES = process.env.NODE_ENV !== "production";

export type Photo = { url: string; thumbUrl: string };

/** Mirrors CATEGORY_COLORS in the API's category model. */
export type CategoryColor = "amber" | "sky" | "pink" | "emerald" | "violet" | "rose" | "teal" | "orange" | "slate";

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: CategoryColor;
  /** Items in stock; absent on sample data. */
  productCount?: number;
};

export type ProductCondition = "new" | "premium" | "semi_new" | "good" | "fair";
export type ProductStatus = "active" | "reserved" | "sold";

export type Product = {
  id: string;
  /** Public reference, e.g. "HL-000123" (searchable in the store). */
  ref: string;
  /** Unique visitors (one per visitor per day). */
  views: number;
  slug: string;
  title: string;
  description: string;
  photos: Photo[];
  condition: ProductCondition;
  price: number;
  originalPrice?: number;
  savingPercent?: number;
  /**
   * Admin's estimate of the same item new in UAE shops: a reference shown next to our price
   * (LoopHome's own items only; sent only with a saving of at least 1%, never below the struck-through
   * price). Never a cost.
   */
  priceWhenNew?: number;
  /** The team's condition score out of 10 after inspection (LoopHome's own items only). */
  conditionScore?: number;
  currency: string;
  negotiable: boolean;
  warrantyDays: number;
  highlights: string[];
  /** How long the previous owner used it; value 0 = never used, null = unknown. */
  usage?: { value: number; unit: "months" | "years" } | null;
  /** false = listed by its owner and not checked by LoopHome ("Unchecked by our experts"); no warranty. */
  inspected: boolean;
  /** Admin offers: no delivery fee, free assembly, and service keys included free. */
  freeDelivery: boolean;
  /** LoopHome assembles the item for free (absent on sample data). */
  freeAssembly?: boolean;
  freeServices: string[];
  status: ProductStatus;
  category?: { id: string; slug: string; name: string; color: CategoryColor };
  publishedAt?: string;
  updatedAt: string;
};

export type ProductDetail = Product & { similar: Product[] };

export type ProductPage = { items: Product[]; nextCursor: string | null };

export type Feed = {
  newArrivals: Product[];
  byCategory: { category: Category; items: Product[] }[];
  bestDeals: Product[];
};

export type ServiceOption = { key: string; name: string; fee: number; categories: string[] };

export type PublicSettings = {
  store: { name: string; phone: string; whatsapp: string; email: string; address: string; hours: string };
  /** The online store (buying). Off: /store, categories and products 404 and every store link hides. */
  shop?: { enabled: boolean };
  delivery: {
    enabled: boolean;
    pickupEnabled: boolean;
    defaultFee: number;
    currency: string;
    cityFees: { city: string; fee: number }[];
    /** Delivery is free when the item price is at or above this. */
    freeOver: number | null;
  };
  /** Optional services (installation, assembly…) set by the admin; fee 0 = free. */
  services: ServiceOption[];
  /** Moving service: every move starts with a site visit; "starting from" prices are optional. */
  moving?: {
    enabled: boolean;
    startingFrom: { office: number | null; home: number | null };
    currency: string;
    services: { key: string; label: string; description: string }[];
  };
  /** Technician visits: types are admin-managed; visitFee null = price confirmed by phone. */
  technician?: {
    enabled: boolean;
    visitFee: number | null;
    currency: string;
    types: { key: string; name: string; description: string }[];
  };
  /** Pickup truck with a driver for `hours` hours (basePrice), plus 1..maxWorkers workers; basePrice null = price confirmed by phone. */
  pickupRental?: { enabled: boolean; basePrice: number | null; hours: number; workerPrice: number; maxWorkers: number; currency: string };
  /** Car recovery (flatbed): priced by distance, quoted on WhatsApp; startingFrom null = no price shown. */
  carRecovery?: { enabled: boolean; startingFrom: number | null; currency: string };
  /** Owner listings: LoopHome's commission and how long a listing stays live. */
  listing?: { commissionPercent: number; days: number };
  currencies: string[];
};

/** The store is on unless the admin switched it off (older API responses have no `shop`). */
export const shopEnabled = (s: PublicSettings | null | undefined) => s?.shop?.enabled !== false;

/** Marks data that came from the dev sample set, so pages can say so. */
export type MaybeSample<T> = T & { sample?: boolean };

type Fetched<T> = { data: T | null; reachable: boolean };

/** Thrown for API failures other than 404, so Next keeps the last good (ISR) page or serves a 5xx. */
export class ApiUnavailableError extends Error {}

/** Lets the API exempt this server from its per-IP rate limit (all SSR traffic shares one IP). */
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

/**
 * At build time (e.g. a first deploy before the API is live) the route renders on request instead of
 * failing the build; nothing empty gets baked in. At request time this is the usual ApiUnavailableError.
 */
async function unavailable(message: string, cause?: unknown): Promise<never> {
  if (process.env.NEXT_PHASE === "phase-production-build") await connection();
  throw new ApiUnavailableError(message, { cause });
}

/**
 * Only a 404 means "doesn't exist". A 429, 5xx or network error must never become a 404 page
 * or an empty listing that gets cached and indexed. In development it falls back to samples.
 */
async function request<T>(
  path: string,
  locale: Locale,
  revalidate: number,
  { notFoundOk = false, badRequestOk = false }: { notFoundOk?: boolean; badRequestOk?: boolean } = {},
): Promise<Fetched<T>> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${sep}lang=${locale}`, {
      // One tag for all API data, so an admin change (e.g. switching a service off) can refresh the site.
      next: { revalidate, tags: [API_CACHE_TAG] },
      headers: INTERNAL_KEY ? { "x-internal-key": INTERNAL_KEY } : undefined,
    });
  } catch (err) {
    if (USE_SAMPLES) return { data: null, reachable: false };
    return unavailable(`API unreachable: ${path}`, err);
  }
  if (res.ok) return { data: (await res.json()) as T, reachable: true };
  // A 404 is only meaningful for a single item; on a list endpoint it means API_URL is wrong,
  // which must fail loudly instead of publishing an empty sitemap or store.
  if (res.status === 404 && (notFoundOk || USE_SAMPLES)) return { data: null, reachable: true };
  // A malformed query from the URL (stale cursor, junk filter) is the visitor's input, not an outage.
  if (res.status === 400 && badRequestOk) return { data: null, reachable: true };
  if (USE_SAMPLES) return { data: null, reachable: false };
  return unavailable(`API ${res.status}: ${path}`);
}

/** GET for a list/config endpoint; any failure throws (in development only, null when the API is down). */
export async function apiGet<T>(path: string, locale: Locale, revalidate = 60): Promise<T | null> {
  return (await request<T>(path, locale, revalidate)).data;
}

/** GET for a single item: null when it doesn't exist (404). */
async function apiGetItem<T>(path: string, locale: Locale, revalidate = 60): Promise<T | null> {
  return (await request<T>(path, locale, revalidate, { notFoundOk: true })).data;
}

/** Samples only stand in when the API is down, never for a real 404 or an empty store. */
const fallBackToSamples = (r: Fetched<unknown>) => USE_SAMPLES && !r.reachable;

export async function getCategories(locale: Locale): Promise<Category[]> {
  const r = await request<{ items: Category[] }>("/categories", locale, 300);
  if (r.data) return r.data.items;
  return fallBackToSamples(r) ? SAMPLE_CATEGORIES(locale) : [];
}

export async function getSettings(locale: Locale): Promise<PublicSettings | null> {
  return apiGet<PublicSettings>("/settings/public", locale, 300);
}

export async function getFeed(locale: Locale): Promise<MaybeSample<Feed>> {
  const r = await request<Feed>("/products/feed", locale, 60);
  if (r.data) return r.data;
  if (fallBackToSamples(r)) return { ...sampleFeed(locale), sample: true };
  return { newArrivals: [], byCategory: [], bestDeals: [] };
}

export type SearchParams = {
  q?: string;
  category?: string;
  condition?: string;
  negotiable?: string;
  inspected?: string;
  sort?: string;
  cursor?: string;
};

export async function searchProducts(locale: Locale, params: SearchParams): Promise<MaybeSample<ProductPage>> {
  const qs = new URLSearchParams({ limit: "24" });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const r = await request<ProductPage>(`/products?${qs}`, locale, 30, { badRequestOk: true });
  if (r.data) return r.data;
  if (fallBackToSamples(r)) return { ...sampleSearch(locale, params), sample: true };
  if (r.reachable) return { items: [], nextCursor: null };
  return { items: [], nextCursor: null };
}

export async function getProduct(locale: Locale, slug: string): Promise<MaybeSample<ProductDetail> | null> {
  const r = await request<ProductDetail>(`/products/${encodeURIComponent(slug)}`, locale, 60, { notFoundOk: true });
  if (r.data) return r.data;
  if (!fallBackToSamples(r)) return null;
  const sample = sampleProduct(locale, slug);
  return sample ? { ...sample, sample: true } : null;
}

/** Walks the public cursor pagination up to `max` active products (sitemap, llms.txt). Never uses samples. */
export async function getAllProducts(locale: Locale, max = 20000): Promise<Product[]> {
  const items: Product[] = [];
  let cursor: string | null = null;
  do {
    const query: string = `/products?sort=newest&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page: ProductPage | null = await apiGet(query, locale, 600);
    if (!page) break;
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor && items.length < max);
  return items.slice(0, max);
}

// ---------- Blog ----------

export type BlogCategory = "selling" | "buying" | "moving" | "home-services" | "guides";

export type BlogCard = {
  slug: string;
  category: BlogCategory;
  tags: string[];
  title: string;
  /** Also the meta description (140–160 chars). */
  excerpt: string;
  cover: Photo | null;
  author: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
};

export type BlogPost = BlogCard & {
  /** Markdown without an H1; internal links are already locale-prefixed. */
  content: string;
  faq: { question: string; answer: string }[];
  alternates: { en?: { title: string }; ar?: { title: string } };
  related: BlogCard[];
};

export type BlogPage = { items: BlogCard[]; total: number; page: number; pages: number };

export async function getBlog(
  locale: Locale,
  params: { category?: string; q?: string; page?: number; limit?: number } = {},
): Promise<BlogPage> {
  const qs = new URLSearchParams({ limit: String(params.limit ?? 12), page: String(params.page ?? 1) });
  if (params.category) qs.set("category", params.category);
  if (params.q) qs.set("q", params.q);
  return (await apiGet<BlogPage>(`/blog?${qs}`, locale, 300)) ?? { items: [], total: 0, page: 1, pages: 1 };
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPost | null> {
  return apiGetItem<BlogPost>(`/blog/${encodeURIComponent(slug)}`, locale, 300);
}

export async function getBlogSitemap(): Promise<{ slug: string; updatedAt: string; publishedAt: string }[]> {
  return (await apiGet<{ items: { slug: string; updatedAt: string; publishedAt: string }[] }>("/blog/sitemap", "en", 600))?.items ?? [];
}
