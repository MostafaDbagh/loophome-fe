/**
 * URL params that change what the static store and blog listings show. They're applied in the
 * browser, and those URLs keep the listing's canonical, so search engines fold them into it.
 */
export const STORE_FILTER_KEYS = ["q", "condition", "negotiable", "inspected", "sort", "cursor"] as const;
export const BLOG_FILTER_KEYS = ["category", "q", "page"] as const;
