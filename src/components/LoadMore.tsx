"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { Product, ProductPage } from "@/lib/api";
import { ProductGrid } from "./ProductGrid";

/**
 * Appends the next cursor pages below the server-rendered first page. The button is a
 * real link (?cursor=…) so crawlers can reach every product; JS users load in place.
 */
export function LoadMore({
  apiQuery,
  pageQuery,
  initialCursor,
}: {
  apiQuery: string;
  pageQuery: string;
  initialCursor: string | null;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [items, setItems] = useState<Product[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function load(e: React.MouseEvent) {
    e.preventDefault();
    if (!cursor || loading) return;
    setLoading(true);
    const qs = new URLSearchParams(apiQuery);
    qs.set("cursor", cursor);
    qs.set("limit", "24");
    qs.set("lang", locale);
    try {
      const res = await fetch(`/api/v1/products?${qs}`);
      if (res.ok) {
        const page = (await res.json()) as ProductPage;
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  const href = `?${pageQuery ? `${pageQuery}&` : ""}cursor=${encodeURIComponent(cursor ?? "")}`;

  return (
    <>
      {items.length > 0 && (
        <div className="mt-5">
          <ProductGrid products={items} />
        </div>
      )}
      {cursor && (
        <div className="mt-8 text-center">
          <a href={href} onClick={load} aria-busy={loading} className="btn-ghost">
            {loading ? "…" : t("loadMore")}
          </a>
        </div>
      )}
    </>
  );
}
