import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogBrowser, BlogList } from "@/components/blog/BlogBrowser";
import type { Locale } from "@/i18n/routing";
import { getBlog } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/listingParams";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

// Static, refreshed at most every 5 minutes (ISR). A search or later page (?q=, ?page=) gets the same
// page and canonical, and is fetched in the browser. Categories have their own pages (category/[category]).
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({ locale, path: routes.blog, title: t("metaTitle"), description: t("metaDescription"), absoluteTitle: true });
}

export default async function BlogIndex({ params }: PageProps<"/[locale]/blog">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const [data, messages] = await Promise.all([getBlog(locale, { limit: BLOG_PAGE_SIZE }), getMessages({ locale })]);
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
  ];

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

      {/* The fallback is what the static HTML holds (and crawlers see): the unfiltered first page. */}
      {/* A nested provider replaces the inherited messages, so it carries every namespace the list uses. */}
      <NextIntlClientProvider messages={{ blog: messages.blog, nav: messages.nav }}>
        <Suspense fallback={<BlogList p={{}} data={data} fallback />}>
          <BlogBrowser initial={data} />
        </Suspense>
      </NextIntlClientProvider>
    </div>
  );
}
