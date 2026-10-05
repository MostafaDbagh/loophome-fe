import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCardView, BlogFilters } from "@/components/blog/BlogBits";
import type { Locale } from "@/i18n/routing";
import { getBlog, type BlogCategory } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/listingParams";
import { BLOG_CATEGORIES, routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

// Static, refreshed at most every 5 minutes (ISR). Each category is its own indexable page, with its
// own canonical and hreflang (the old /blog?category= URLs redirect here). Any other category is a 404.
// Not `dynamicParams = false`: with it, Next 16 answers 404 for every category once an admin change
// expires the API cache tag (/api/revalidate), until the next deploy.
export const revalidate = 300;

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({ category }));
}

const isCategory = (value: string): value is BlogCategory => (BLOG_CATEGORIES as readonly string[]).includes(value);

/** Every post in the category, so there are no page links. Same request in metadata and page. */
const postsIn = (locale: Locale, category: BlogCategory) => getBlog(locale, { category, limit: BLOG_PAGE_SIZE });

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/category/[category]">): Promise<Metadata> {
  const { locale: lang, category } = await params;
  const locale = lang as Locale;
  if (!isCategory(category)) return {};
  const t = await getTranslations({ locale, namespace: "blog" });
  // An empty category is a thin page: kept out of the index (and the sitemap) until it has posts.
  const { total } = await postsIn(locale, category);
  return pageMetadata({
    locale,
    path: routes.blogCategory(category),
    title: t(`categoryPages.${category}.title`),
    description: t(`categoryPages.${category}.description`),
    noindex: total === 0,
  });
}

export default async function BlogCategoryPage({ params }: PageProps<"/[locale]/blog/category/[category]">) {
  const { locale: lang, category } = await params;
  const locale = lang as Locale;
  if (!isCategory(category)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const { items } = await postsIn(locale, category);
  const path = routes.blogCategory(category);
  const h1 = t(`categoryPages.${category}.h1`);
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
    { name: t(`categories.${category}`), path },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd
        data={[
          ...collectionSchema(locale, { name: h1, description: t(`categoryPages.${category}.description`), path }, []),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{h1}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t(`categoryPages.${category}.intro`)}</p>
      </header>

      <BlogFilters category={category} />

      <section className="mt-8" aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="sr-only">
          {t("listHeading")}
        </h2>
        {items.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((card, i) => (
              <BlogCardView key={card.slug} card={card} priority={i === 0} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
        )}
      </section>
    </div>
  );
}
