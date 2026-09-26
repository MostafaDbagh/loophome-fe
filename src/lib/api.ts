import type { Locale } from "@/i18n/routing";
import { SAMPLE_CATEGORIES, sampleFeed, sampleProduct, sampleSearch } from "./sample-data";

/** Server-side API root, e.g. http://localhost:5000/api/v1. Browsers use the /api/v1 rewrite instead. */
export const API_URL = (process.env.API_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

/** Dev only: when the API is down or not built yet, pages render sample items instead of empty screens. */
const USE_SAMPLES = process.env.NODE_ENV !== "production";

export type Photo = { url: string; thumbUrl: string };

/** Mirrors CATEGORY_COLORS in the API's category model. */
export type CategoryColor = "amber" | "sky" | "pink" | "emerald" | "violet" | "rose" | "teal" | "orange" | "slate";

export type Category = { id: string; slug: string; name: string; icon: string; color: CategoryColor };

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
  currency: string;
  negotiable: boolean;
  warrantyDays: number;
  highlights: string[];
  /** false = listed by its owner and not checked by HomeLoop ("Unchecked by our experts"); no warranty. */
  inspected: boolean;
  /** Admin offers: no delivery fee, and service keys included free. */
  freeDelivery: boolean;
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
  /** Owner listings: HomeLoop's commission and how long a listing stays live. */
  listing?: { commissionPercent: number; days: number };
  currencies: string[];
};

/** Marks data that came from the dev sample set, so pages can say so. */
export type MaybeSample<T> = T & { sample?: boolean };

type Fetched<T> = { data: T | null; reachable: boolean };

/** Thrown for API failures other than 404, so Next keeps the last good (ISR) page or serves a 5xx. */
export class ApiUnavailableError extends Error {}

/** Lets the API exempt this server from its per-IP rate limit (all SSR traffic shares one IP). */
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

/**
 * Only a 404 means "doesn't exist". A 429, 5xx or network error must never become a 404 page
 * or an empty listing that gets cached and indexed. In development it falls back to samples.
 */
async function request<T>(path: string, locale: Locale, revalidate: number): Promise<Fetched<T>> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${sep}lang=${locale}`, {
      next: { revalidate },
      headers: INTERNAL_KEY ? { "x-internal-key": INTERNAL_KEY } : undefined,
    });
  } catch (err) {
    if (USE_SAMPLES) return { data: null, reachable: false };
    throw new ApiUnavailableError(`API unreachable: ${path}`, { cause: err });
  }
  if (res.ok) return { data: (await res.json()) as T, reachable: true };
  if (res.status === 404) return { data: null, reachable: true };
  if (USE_SAMPLES) return { data: null, reachable: false };
  throw new ApiUnavailableError(`API ${res.status}: ${path}`);
}

/** GET that returns null for a 404 (and, in development only, when the API is down). */
export async function apiGet<T>(path: string, locale: Locale, revalidate = 60): Promise<T | null> {
  return (await request<T>(path, locale, revalidate)).data;
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
  const r = await request<ProductPage>(`/products?${qs}`, locale, 30);
  if (r.data) return r.data;
  if (fallBackToSamples(r)) return { ...sampleSearch(locale, params), sample: true };
  return { items: [], nextCursor: null };
}

export async function getProduct(locale: Locale, slug: string): Promise<MaybeSample<ProductDetail> | null> {
  const r = await request<ProductDetail>(`/products/${encodeURIComponent(slug)}`, locale, 60);
  if (r.data) return r.data;
  if (!fallBackToSamples(r)) return null;
  const sample = sampleProduct(locale, slug);
  return sample ? { ...sample, sample: true } : null;
}

/** Walks the public cursor pagination up to `max` active products (sitemap, llms.txt). Never uses samples. */
export async function getAllProducts(locale: Locale, max = 1000): Promise<Product[]> {
  const items: Product[] = [];
  let cursor: string | null = null;
  do {
    const query: string = `/products?sort=newest&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page: ProductPage | null = await apiGet(query, locale, 3600);
    if (!page) break;
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor && items.length < max);
  return items.slice(0, max);
}
