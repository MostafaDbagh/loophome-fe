import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pickFilters, StoreView } from "@/components/StoreView";
import type { Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getCategories, getSettings, shopEnabled } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/store">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (!shopEnabled(await getSettings(locale))) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const t = await getTranslations({ locale, namespace: "meta.store" });
  const filtered = Object.keys(pickFilters(await searchParams)).length > 0;
  return pageMetadata({ locale, path: routes.store, title: t("title"), description: t("description"), noindex: filtered });
}

export default async function StorePage({ params, searchParams }: PageProps<"/[locale]/store">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  // The admin can close the store; its pages then 404 like any missing page.
  if (!shopEnabled(await getSettings(locale))) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });

  return (
    <StoreView
      locale={locale}
      h1={t("store.h1")}
      intro={t("store.intro")}
      metaDescription={t("store.description")}
      path={routes.store}
      crumbs={[
        { name: t("breadcrumb.home"), path: routes.home },
        { name: t("breadcrumb.store"), path: routes.store },
      ]}
      categories={await getCategories(locale)}
      filters={pickFilters(await searchParams)}
    />
  );
}
