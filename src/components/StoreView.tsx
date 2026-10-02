import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import type { CategoryCopy } from "@/content/categories";
import type { Locale } from "@/i18n/routing";
import { searchProducts, type Category } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, faqSchema, JsonLd } from "@/lib/seo/jsonld";
import { STORE_FILTER_KEYS } from "@/lib/listingParams";
import { toQuery } from "@/lib/storeFilters";
import { Breadcrumbs } from "./Breadcrumbs";
import { SampleNotice } from "./Section";
import { StoreFilters, StoreFiltersFromUrl } from "./StoreFilters";
import { StoreResults, StoreResultsView } from "./StoreResults";

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
}) {
  const t = await getTranslations({ locale, namespace: "store" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const th = await getTranslations({ locale, namespace: "home" });
  // Static (ISR): always the first, unfiltered page. Filters in the URL are applied in the browser.
  const page = await searchProducts(locale, { category: category?.slug });
  const texts = { empty: th("empty"), emptyFiltered: t("empty") };
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

      {/* The fallbacks are what the static HTML holds (and crawlers see): the unfiltered bar and listing. */}
      <Suspense fallback={<StoreFilters categories={categories} activeCategory={category?.slug} current={{}} />}>
        <StoreFiltersFromUrl categories={categories} activeCategory={category?.slug} />
      </Suspense>

      <section className="mt-8" aria-labelledby="results-heading">
        <h2 id="results-heading" className="sr-only">
          {tc("available")}
        </h2>
        <Suspense
          fallback={
            <StoreResultsView
              items={page.items}
              nextCursor={page.nextCursor}
              apiQuery={toQuery({ category: category?.slug })}
              pageQuery=""
              filtered={false}
              texts={texts}
              pendingKeys={STORE_FILTER_KEYS}
            />
          }
        >
          <StoreResults initial={page} category={category?.slug} texts={texts} />
        </Suspense>
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
