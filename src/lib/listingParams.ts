/**
 * URL params that change what the static store and blog listings show. They're applied in the
 * browser, and those URLs keep the listing's canonical, so search engines fold them into it.
 */
export const STORE_FILTER_KEYS = ["q", "condition", "negotiable", "inspected", "sort", "cursor"] as const;
// Categories have their own pages (/blog/category/selling); the proxy redirects the old ?category= URLs there.
export const BLOG_FILTER_KEYS = ["q", "page"] as const;

/** Posts per blog listing page: the API's maximum, so the static pages hold every post and need no ?page= links for now. */
export const BLOG_PAGE_SIZE = 50;
