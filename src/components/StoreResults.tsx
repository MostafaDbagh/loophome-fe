"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product, ProductPage } from "@/lib/api";
import type { STORE_FILTER_KEYS } from "@/lib/listingParams";
import { pickFilters, toQuery } from "@/lib/storeFilters";
import { LoadMore } from "./LoadMore";
import { ListingPlaceholder, PendingIfFiltered } from "./PendingIfFiltered";
import { ProductGrid } from "./ProductGrid";

type Texts = { empty: string; emptyFiltered: string };

/** The listing as the server rendered it (no filters): also the static page's HTML for crawlers. */
export function StoreResultsView({
  items,
  nextCursor,
  apiQuery,
  pageQuery,
  filtered,
  texts,
  busy = false,
  pendingKeys,
}: {
  items: Product[];
  nextCursor: string | null;
  /** Filters + category for the API, without the cursor. */
  apiQuery: string;
  /** Filters for the page URL, without the cursor. */
  pageQuery: string;
  filtered: boolean;
  texts: Texts;
  busy?: boolean;
  /** Static fallback only: hide this unfiltered page before paint when the URL has these params. */
  pendingKeys?: typeof STORE_FILTER_KEYS;
}) {
  return (
    <div aria-busy={busy} className={busy ? "opacity-60 transition-opacity" : undefined}>
      {pendingKeys && <PendingIfFiltered keys={pendingKeys} />}
      {items.length ? (
        <>
          <ProductGrid products={items} preloadFirst />
          <LoadMore key={`${apiQuery}|${nextCursor}`} apiQuery={apiQuery} pageQuery={pageQuery} initialCursor={nextCursor} />
        </>
      ) : (
        // A filtered "no match" keeps the space the loading placeholder held, so the footer doesn't jump up.
        <div className={filtered ? "min-h-[60vh]" : undefined}>
          <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{filtered ? texts.emptyFiltered : texts.empty}</p>
        </div>
      )}
    </div>
  );
}

/**
 * The store page is static (ISR): its HTML always holds the first, unfiltered page. Filters, search,
 * sort and "load more" links (?cursor=) live in the URL and are fetched here, in the browser.
 */
export function StoreResults({ initial, category, texts }: { initial: ProductPage; category?: string; texts: Texts }) {
  const locale = useLocale();
  const filters = pickFilters(Object.fromEntries(useSearchParams()));
  const key = toQuery({ ...filters });
  const withoutCursor = { ...filters, cursor: undefined };
  const apiQuery = toQuery({ ...withoutCursor, category });
  const pageQuery = toQuery(withoutCursor);
  const [result, setResult] = useState<{ key: string; page: ProductPage } | null>(null);
  // Opened on a filtered URL: the static page was hidden before paint, so keep that space until results come.
  const [firstKey] = useState(key);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    const qs = new URLSearchParams(toQuery({ ...filters, category }));
    qs.set("limit", "24");
    qs.set("lang", locale);
    fetch(`/api/v1/products?${qs}`)
      // A stale cursor or junk filter answers 400: show an empty listing, like the server used to.
      .then((res) => (res.ok ? (res.json() as Promise<ProductPage>) : { items: [], nextCursor: null }))
      .catch(() => ({ items: [], nextCursor: null }))
      .then((page) => alive && setResult({ key, page }));
    return () => {
      alive = false;
    };
    // `key` covers every filter; `filters` is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, category, locale]);

  if (!key) {
    return <StoreResultsView items={initial.items} nextCursor={initial.nextCursor} apiQuery={apiQuery} pageQuery={pageQuery} filtered={false} texts={texts} />;
  }
  const page = result?.key === key ? result.page : null;
  if (!page && !result && key === firstKey) return <ListingPlaceholder />;
  // Until the filtered page arrives, keep the previous listing on screen (dimmed) so nothing jumps.
  const shown = page ?? result?.page ?? initial;
  return (
    <StoreResultsView
      items={shown.items}
      nextCursor={page ? page.nextCursor : null}
      apiQuery={apiQuery}
      pageQuery={pageQuery}
      filtered
      texts={texts}
      busy={!page}
    />
  );
}
