"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { BlogCategory, BlogPage } from "@/lib/api";
import { BLOG_FILTER_KEYS } from "@/lib/listingParams";
import { routes } from "@/lib/seo/config";
import { ListingPlaceholder, PendingIfFiltered } from "../PendingIfFiltered";
import { BlogCardView } from "./BlogBits";

const CATEGORIES: BlogCategory[] = ["selling", "buying", "moving", "home-services", "guides"];

type Params = { category?: string; q?: string; page?: number };

function read(search: URLSearchParams): Params {
  const one = (k: string) => search.get(k)?.trim() || undefined;
  const category = one("category");
  return {
    category: category && CATEGORIES.includes(category as BlogCategory) ? category : undefined,
    q: one("q")?.slice(0, 100),
    page: Math.max(1, Number(one("page")) || 1),
  };
}

/** The listing's query string: "" for the unfiltered first page (the one the static page holds). */
function toQuery(p: Params) {
  const qs = new URLSearchParams();
  if (p.category) qs.set("category", p.category);
  if (p.q) qs.set("q", p.q);
  if ((p.page ?? 1) > 1) qs.set("page", String(p.page));
  return qs.toString();
}

/** Category chips, search, posts and page links for one state of the listing. */
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
  const tn = useTranslations("nav");
  const locale = useLocale();
  const href = (changes: Params) => {
    const s = toQuery({ ...p, ...changes });
    return `${routes.blog}${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink/40"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label={tn("blog")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href={href({ category: undefined, page: 1 })} className={chip(!p.category)}>
            {t("all")}
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href({ category: c, page: 1 })} className={chip(p.category === c)}>
              {t(`categories.${c}`)}
            </Link>
          ))}
        </nav>
        {/* Plain GET form: works without JS and keeps the category. */}
        <form key={p.q ?? ""} role="search" action={`/${locale}${routes.blog}`} className="relative ms-auto w-full sm:w-72">
          {p.category && <input type="hidden" name="category" value={p.category} />}
          <Search aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={p.q} aria-label={t("search")} placeholder={t("search")} className="field rounded-full! py-2! ps-10!" />
        </form>
      </div>

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
 * The blog index is static (ISR): its HTML always holds the first, unfiltered page. A category,
 * search or later page in the URL is fetched here, in the browser (next.config marks those URLs noindex).
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
    qs.set("limit", "12");
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
