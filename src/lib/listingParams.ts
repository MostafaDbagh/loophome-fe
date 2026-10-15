/**
 * Store filters are applied in the browser and share the listing canonical.
 * Blog search and pagination are rendered on the server.
 */
export const STORE_FILTER_KEYS = ["q", "condition", "negotiable", "inspected", "sort", "cursor"] as const;
// Categories have their own pages (/blog/category/selling); the proxy redirects the old ?category= URLs there.
export const BLOG_FILTER_KEYS = ["q", "page"] as const;

/** Posts per server-rendered blog listing page (the API maximum). */
export const BLOG_PAGE_SIZE = 50;

/** Normalize untrusted listing input before using it in API requests and canonical URLs. */
export function blogParams(search: Record<string, string | string[] | undefined>) {
  const value = (key: string) => typeof search[key] === "string" ? search[key].trim() : "";
  const number = Number(value("page"));
  return {
    page: Number.isSafeInteger(number) && number > 0 ? number : 1,
    q: value("q").slice(0, 100) || undefined,
  };
}

export function blogPagePath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path;
}
