import { Search } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCardView } from "@/components/blog/BlogBits";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlog, type BlogCategory } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

const CATEGORIES: BlogCategory[] = ["selling", "buying", "moving", "home-services", "guides"];

type Params = { category?: string; q?: string; page?: number };
function read(raw: Record<string, string | string[] | undefined>): Params {
  const one = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string) : undefined);
  const category = one("category");
  return {
    category: category && CATEGORIES.includes(category as BlogCategory) ? category : undefined,
    q: one("q"),
    page: Math.max(1, Number(one("page")) || 1),
  };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "blog" });
  const p = read(await searchParams);
  // Only the unfiltered first page is indexed; filters, search and later pages stay crawlable but noindex.
  const variant = !!(p.category || p.q || (p.page ?? 1) > 1);
  return pageMetadata({ locale, path: routes.blog, title: t("metaTitle"), description: t("metaDescription"), absoluteTitle: true, noindex: variant });
}

export default async function BlogIndex({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const p = read(await searchParams);
  const data = await getBlog(locale, p);
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
  ];
  const href = (changes: Params) => {
    const next = { ...p, ...changes };
    const qs = new URLSearchParams();
    if (next.category) qs.set("category", next.category);
    if (next.q) qs.set("q", next.q);
    if ((next.page ?? 1) > 1) qs.set("page", String(next.page));
    const s = qs.toString();
    return `${routes.blog}${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink/40"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd
        data={[
          ...collectionSchema(locale, { name: t("h1"), description: t("metaDescription"), path: routes.blog }, []),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("h1")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("intro")}</p>
      </header>

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
        <form role="search" action={`/${locale}${routes.blog}`} className="relative ms-auto w-full sm:w-72">
          {p.category && <input type="hidden" name="category" value={p.category} />}
          <Search aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={p.q} aria-label={t("search")} placeholder={t("search")} className="field rounded-full! py-2! ps-10!" />
        </form>
      </div>

      <section className="mt-8" aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="sr-only">
          {t("listHeading")}
        </h2>
        {data.items.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((card, i) => (
              <BlogCardView key={card.slug} card={card} priority={i === 0} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
        )}
      </section>

      {data.pages > 1 && (
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
    </div>
  );
}
