import { ComingSoonPage } from "@/components/ComingSoon";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StoreView } from "@/components/StoreView";
import { categoryCopy } from "@/content/categories";
import type { Locale } from "@/i18n/routing";
import { buildParams, getCategories, getSettings, searchProducts, shopEnabled, type Category } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";

// Static per category, refreshed at most once a minute (ISR). Filtered URLs apply their filters in
// the browser; next.config marks them noindex.
export const revalidate = 60;

/** Every category is prerendered at build; one added later renders on its first visit. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return buildParams(async () => (await getCategories(params.locale as Locale)).map((c) => ({ category: c.slug })));
}

async function load(locale: Locale, slug: string) {
  const categories = await getCategories(locale);
  return { categories, category: categories.find((c) => c.slug === slug) };
}

/** Hand-written copy for known categories; a grammatical template for ones the admin adds later. */
async function copyFor(locale: Locale, category: Category) {
  const written = categoryCopy(category.slug, locale);
  if (written) return written;
  const t = await getTranslations({ locale, namespace: "meta.category" });
  const vars = { category: category.name };
  return { title: t("title", vars), description: t("description", vars), h1: category.name, intro: t("description", vars), body: [], faqs: [] };
}

export async function generateMetadata({ params }: PageProps<"/[locale]/store/[category]">): Promise<Metadata> {
  const { locale, category: slug } = (await params) as { locale: Locale; category: string };
  const { category } = await load(locale, slug);
  if (!category) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const copy = await copyFor(locale, category);
  if (!shopEnabled(await getSettings(locale))) {
    return pageMetadata({ locale, path: routes.category(slug), title: copy.title, description: copy.description, noindex: true });
  }
  // An empty category is a thin page: kept out of the index (and the sitemap) until it has stock.
  // Same request as the page's own listing, so the fetch is shared.
  const empty = (await searchProducts(locale, { category: slug })).items.length === 0;
  return pageMetadata({ locale, path: routes.category(slug), title: copy.title, description: copy.description, noindex: empty });
}

export default async function CategoryPage({ params }: PageProps<"/[locale]/store/[category]">) {
  const { locale, category: slug } = (await params) as { locale: Locale; category: string };
  setRequestLocale(locale);
  const { categories, category } = await load(locale, slug);
  if (!category) notFound();
  const t = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const copy = await copyFor(locale, category);
  const crumbs = [
    { name: t("home"), path: routes.home },
    { name: t("store"), path: routes.store },
    { name: category.name, path: routes.category(category.slug) },
  ];
  // Store closed by the admin: "coming soon" instead of products.
  if (!shopEnabled(await getSettings(locale))) return <ComingSoonPage title={copy.h1} intro={copy.intro} crumbs={crumbs} />;

  return (
    <StoreView
      locale={locale}
      h1={copy.h1}
      intro={copy.intro}
      metaDescription={copy.description}
      path={routes.category(category.slug)}
      crumbs={crumbs}
      categories={categories}
      category={category}
      copy={copy}
    />
  );
}
