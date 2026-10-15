import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogList } from "@/components/blog/BlogBrowser";
import type { Locale } from "@/i18n/routing";
import { getBlog } from "@/lib/api";
import { BLOG_PAGE_SIZE, blogParams, blogPagePath } from "@/lib/listingParams";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

// Render pagination on the server so each page exposes its own posts and canonical URL.
export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "blog" });
  const p = blogParams(await searchParams);
  const data = await getBlog(locale, { ...p, limit: BLOG_PAGE_SIZE });
  if (p.page > Math.max(1, data.pages)) notFound();
  const title = p.page > 1 ? `${t("metaTitle")} — ${t("page", { page: p.page, pages: data.pages })}` : t("metaTitle");
  return pageMetadata({ locale, path: blogPagePath(routes.blog, p.page), title, description: t("metaDescription"), absoluteTitle: true, noindex: !!p.q });
}

export default async function BlogIndex({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const p = blogParams(await searchParams);
  const [data, messages] = await Promise.all([getBlog(locale, { ...p, limit: BLOG_PAGE_SIZE }), getMessages({ locale })]);
  if (p.page > Math.max(1, data.pages)) notFound();
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd
        data={[
          ...collectionSchema(locale, { name: t("h1"), description: t("metaDescription"), path: blogPagePath(routes.blog, p.page) }, []),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("h1")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("intro")}</p>
      </header>

      {/* A nested provider replaces the inherited messages, so it carries every namespace the list uses. */}
      <NextIntlClientProvider messages={{ blog: messages.blog, nav: messages.nav }}>
        <BlogList p={p} data={data} />
      </NextIntlClientProvider>
    </div>
  );
}
