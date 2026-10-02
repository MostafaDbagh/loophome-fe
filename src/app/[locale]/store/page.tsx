import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoonPage } from "@/components/ComingSoon";
import { StoreView } from "@/components/StoreView";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSettings, shopEnabled } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { pageMetadata } from "@/lib/seo/metadata";

// Static, refreshed at most once a minute (ISR). Filtered URLs (?q=, ?sort=…) get the same page and
// apply the filters in the browser; they keep this page's canonical.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]/store">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.store" });
  // A closed store shows "coming soon" and stays out of the index until it reopens.
  const closed = !shopEnabled(await getSettings(locale));
  return pageMetadata({ locale, path: routes.store, title: t("title"), description: t("description"), noindex: closed });
}

export default async function StorePage({ params }: PageProps<"/[locale]/store">) {
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
    />
  );
}
