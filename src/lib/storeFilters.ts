import type { SearchParams } from "./api";

const CONDITIONS = new Set(["new", "premium", "semi_new", "good", "fair"]);
const SORTS = new Set(["newest", "price_asc", "price_desc"]);
const BOOL = new Set(["true", "false"]);

/**
 * Store search params that change the listing; any of them makes the URL a noindex variant
 * (next.config sends the header). Unknown values are dropped so junk URLs show the normal listing.
 */
export function pickFilters(raw: Record<string, string | string[] | undefined>): SearchParams {
  const get = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const out: SearchParams = {};
  // Control characters and overlong input never reach the API.
  const q = get("q").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100);
  if (q) out.q = q;
  const condition = get("condition").split(",").filter((c) => CONDITIONS.has(c)).join(",");
  if (condition) out.condition = condition;
  for (const k of ["negotiable", "inspected"] as const) if (BOOL.has(get(k))) out[k] = get(k);
  if (SORTS.has(get("sort"))) out.sort = get("sort");
  const cursor = get("cursor");
  if (cursor && cursor.length <= 300) out.cursor = cursor;
  return out;
}

export const toQuery = (params: Record<string, string | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
