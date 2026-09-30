import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoonPage } from "@/components/ComingSoon";
import { pickFilters, StoreView } from "@/components/StoreView";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSettings, shopEnabled } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/store">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.store" });
  const filtered = Object.keys(pickFilters(await searchParams)).length > 0;
  // A closed store shows "coming soon" and stays out of the index until it reopens.
  const closed = !shopEnabled(await getSettings(locale));
  return pageMetadata({ locale, path: routes.store, title: t("title"), description: t("description"), noindex: filtered || closed });
}

export default async function StorePage({ params, searchParams }: PageProps<"/[locale]/store">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const crumbs = [
    { name: t("breadcrumb.home"), path: routes.home },
    { name: t("breadcrumb.store"), path: routes.store },
  ];
  // The admin can close the store: it shows "coming soon" instead of products.
  if (!shopEnabled(await getSettings(locale))) return <ComingSoonPage title={t("store.h1")} intro={t("store.intro")} crumbs={crumbs} />;

  return (
    <StoreView
      locale={locale}
      h1={t("store.h1")}
      intro={t("store.intro")}
      metaDescription={t("store.description")}
      path={routes.store}
      crumbs={crumbs}
      categories={await getCategories(locale)}
      filters={pickFilters(await searchParams)}
    />
  );
}
