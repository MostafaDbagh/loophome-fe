/**
 * URL params that change what the static store and blog listings show. They're applied in the
 * browser; next.config sends noindex for URLs that carry them. Kept import-free for next.config.
 */
export const STORE_FILTER_KEYS = ["q", "condition", "negotiable", "inspected", "sort", "cursor"] as const;
export const BLOG_FILTER_KEYS = ["category", "q", "page"] as const;
