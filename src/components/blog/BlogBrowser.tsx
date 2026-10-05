"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { BlogPage } from "@/lib/api";
import { BLOG_FILTER_KEYS, BLOG_PAGE_SIZE } from "@/lib/listingParams";
import { routes } from "@/lib/seo/config";
import { ListingPlaceholder, PendingIfFiltered } from "../PendingIfFiltered";
import { BlogCardView, BlogFilters } from "./BlogBits";

type Params = { q?: string; page?: number };

function read(search: URLSearchParams): Params {
  const one = (k: string) => search.get(k)?.trim() || undefined;
  return {
    q: one("q")?.slice(0, 100),
    page: Math.max(1, Number(one("page")) || 1),
  };
}

/** The listing's query string: "" for the unfiltered first page (the one the static page holds). */
function toQuery(p: Params) {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if ((p.page ?? 1) > 1) qs.set("page", String(p.page));
  return qs.toString();
}

/** Category links, search, posts and page links for one state of the listing. */
export function BlogList({
  p,
  data,
  busy = false,
  pending = false,
  fallback = false,
}: {
  p: Params;
  /** null: the first filtered page is still loading (shows the placeholder). */
  data: BlogPage | null;
  busy?: boolean;
  pending?: boolean;
  /** The static page's HTML: hides itself before paint on a filtered URL. */
  fallback?: boolean;
}) {
  const t = useTranslations("blog");
  const href = (changes: Params) => {
    const s = toQuery({ ...p, ...changes });
    return `${routes.blog}${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <BlogFilters q={p.q} />

      <section className="mt-8" aria-labelledby="posts-heading" aria-busy={busy}>
        {fallback && <PendingIfFiltered keys={BLOG_FILTER_KEYS} />}
        <h2 id="posts-heading" className="sr-only">
          {t("listHeading")}
        </h2>
        {pending || !data ? (
          <ListingPlaceholder />
        ) : data.items.length ? (
          <div className={`grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 ${busy ? "opacity-60 transition-opacity" : ""}`}>
            {data.items.map((card, i) => (
              <BlogCardView key={card.slug} card={card} priority={i === 0} />
            ))}
          </div>
        ) : (
          // A filtered "no match" keeps the space the loading placeholder held, so the footer doesn't jump up.
          <div className={toQuery(p) ? "min-h-[60vh]" : undefined}>
            <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
          </div>
        )}
      </section>

      {data && data.pages > 1 && (
        <nav aria-label={t("page", { page: data.page, pages: data.pages })} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === data.page ? "page" : undefined}
              className={`grid size-10 place-items-center rounded-full text-sm font-semibold ${
                n === data.page ? "bg-ink text-white" : "border border-border hover:border-ink/40"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

/**
 * The blog index is static (ISR): its HTML always holds the first, unfiltered page. A search or
 * later page in the URL is fetched here, in the browser (those URLs keep the index's canonical).
 */
export function BlogBrowser({ initial }: { initial: BlogPage }) {
  const locale = useLocale();
  const p = read(useSearchParams());
  const key = toQuery(p);
  const [result, setResult] = useState<{ key: string; data: BlogPage } | null>(null);
  // Opened on a filtered URL: the static page was hidden before paint, so keep that space until posts come.
  const [firstKey] = useState(key);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    const qs = new URLSearchParams(key);
    qs.set("limit", String(BLOG_PAGE_SIZE));
    qs.set("lang", locale);
    fetch(`/api/v1/blog?${qs}`)
      .then((res) => (res.ok ? (res.json() as Promise<BlogPage>) : null))
      .catch(() => null)
      .then((data) => alive && setResult({ key, data: data ?? { items: [], total: 0, page: 1, pages: 1 } }));
    return () => {
      alive = false;
    };
  }, [key, locale]);

  if (!key) return <BlogList p={{}} data={initial} />;
  const data = result?.key === key ? result.data : null;
  if (!data && !result && key === firstKey) return <BlogList p={p} data={null} pending />;
  // Until the new page arrives, keep the previous posts on screen (dimmed) so nothing jumps.
  return <BlogList p={p} data={data ?? result?.data ?? initial} busy={!data} />;
}
