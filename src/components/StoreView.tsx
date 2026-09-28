import { getTranslations } from "next-intl/server";
import type { CategoryCopy } from "@/content/categories";
import type { Locale } from "@/i18n/routing";
import { searchProducts, type Category, type SearchParams } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, faqSchema, JsonLd } from "@/lib/seo/jsonld";
import { Breadcrumbs } from "./Breadcrumbs";
import { LoadMore } from "./LoadMore";
import { ProductGrid } from "./ProductGrid";
import { SampleNotice } from "./Section";
import { StoreFilters } from "./StoreFilters";

const CONDITIONS = new Set(["new", "premium", "semi_new", "good", "fair"]);
const SORTS = new Set(["newest", "price_asc", "price_desc"]);
const BOOL = new Set(["true", "false"]);

/**
 * Store search params that change the listing; any of them makes the URL a noindex variant.
 * Unknown values are dropped here so junk URLs render the normal listing instead of an API error.
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

const toQuery = (params: Record<string, string | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();

export async function StoreView({
  locale,
  h1,
  intro,
  metaDescription,
  path,
  crumbs,
  categories,
  category,
  copy,
  filters,
}: {
  locale: Locale;
  h1: string;
  intro: string;
  metaDescription: string;
  /** Locale-less path of this listing, e.g. "/store/furniture-home". */
  path: string;
  crumbs: { name: string; path: string }[];
  categories: Category[];
  category?: Category;
  copy?: Pick<CategoryCopy, "body" | "faqs">;
  filters: SearchParams;
}) {
  const t = await getTranslations({ locale, namespace: "store" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const page = await searchProducts(locale, { ...filters, category: category?.slug });
  const pageFilters = { ...filters, cursor: undefined };
  const apiQuery = toQuery({ ...pageFilters, category: category?.slug });
  const faqs = copy?.faqs ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {!page.sample && (
        <JsonLd
          data={[
            ...collectionSchema(locale, { name: h1, description: metaDescription, path }, page.items),
            breadcrumbSchema(locale, crumbs),
            ...(faqs.length ? [faqSchema(faqs)] : []),
          ]}
        />
      )}
      {page.sample && <SampleNotice text={tc("sample")} />}

      <Breadcrumbs items={crumbs} />
      <header className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{h1}</h1>
        <p className="mt-2 max-w-2xl text-muted">{intro}</p>
      </header>

      <StoreFilters
        key={toQuery(pageFilters)}
        categories={categories}
        activeCategory={category?.slug}
        current={pageFilters as Record<string, string | undefined>}
      />

      <section className="mt-8" aria-labelledby="results-heading">
        <h2 id="results-heading" className="sr-only">
          {tc("available")}
        </h2>
        {page.items.length ? (
          <>
            <ProductGrid products={page.items} preloadFirst />
            <LoadMore key={apiQuery} apiQuery={apiQuery} pageQuery={toQuery(pageFilters)} initialCursor={page.nextCursor} />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
        )}
      </section>

      {copy?.body.length || faqs.length ? (
        <div className="mt-16 grid gap-10 border-t border-border pt-10 lg:grid-cols-2">
          {copy?.body.length ? (
            <div className="space-y-3 leading-relaxed text-ink/80">
              {copy.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p>
                <Link
                  href={category?.slug === "appliances-electronics" ? routes.sellAppliances : routes.sell}
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  {tc(category?.slug === "appliances-electronics" ? "sellAppliancesCta" : "sellCta")}
                </Link>
              </p>
              {category?.slug === "appliances-electronics" && (
                <p>
                  <Link href={`${routes.technician}#ac`} className="font-semibold text-ink underline underline-offset-2">
                    {tc("acServiceCta")}
                  </Link>
                </p>
              )}
            </div>
          ) : null}
          {faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-extrabold">{tc("faq")}</h2>
              <dl className="mt-3 divide-y divide-border">
                {faqs.map(({ q, a }) => (
                  <div key={q} className="py-4">
                    <dt className="font-semibold">{q}</dt>
                    <dd className="mt-1 text-ink/80">{a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
