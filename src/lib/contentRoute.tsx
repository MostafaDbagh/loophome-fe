import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentPage } from "@/components/ContentPage";
import { DubaiAreas } from "@/components/DubaiAreas";
import { LAST_UPDATED, PAGES } from "@/content/pages";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings, shopEnabled } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, sellServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

type PageKey = keyof typeof PAGES;

type Options = {
  key: PageKey;
  path: string;
  schemaType: "AboutPage" | "WebPage";
  /** Legal pages show "Last updated". */
  legal?: boolean;
  /** Parent crumb between Home and this page, e.g. Sell for /sell/moving-out. */
  parent?: { labelKey: string; path: string };
  cta?: { labelKey: string; href: string };
  /** Optional second link under the CTA (e.g. moving-out → movers). */
  secondary?: { labelKey: string; href: string };
  /** Message key for a longer search-result title (defaults to the page heading). */
  metaTitleKey?: string;
  /** Sell landing pages: show the Dubai areas we collect from and describe the buying service. */
  sellService?: boolean;
};

type Props = { params: Promise<{ locale: string }> };

/** Metadata + page for the text pages in src/content/pages.ts, so each route file is two lines. */
export function contentRoute({ key, path, schemaType, legal, parent, cta, secondary, metaTitleKey, sellService }: Options) {
  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const locale = (await params).locale as Locale;
    const page = PAGES[key][locale];
    const title = metaTitleKey ? (await getTranslations({ locale }))(metaTitleKey) : page.title;
    return pageMetadata({ locale, path, title, description: page.description });
  }

  async function Page({ params }: Props) {
    const locale = (await params).locale as Locale;
    setRequestLocale(locale);
    const t = await getTranslations({ locale });
    // Links to a service the admin switched off would 404: the store CTA falls back to selling,
    // and other off-service links are dropped.
    const settings = await getSettings(locale);
    const isOff = (href: string) =>
      (href === routes.store && !shopEnabled(settings)) ||
      (href === routes.moving && !settings?.moving?.enabled) ||
      (href === routes.technician && !settings?.technician?.enabled);
    const mainCta = cta && isOff(cta.href) ? { labelKey: "home.sell", href: routes.sell } : cta;
    const extraLink = secondary && !isOff(secondary.href) ? secondary : undefined;
    const page = PAGES[key][locale];
    const crumbs = [
      { name: t("meta.breadcrumb.home"), path: "" },
      ...(parent ? [{ name: t(parent.labelKey), path: parent.path }] : []),
      { name: page.crumb ?? page.title, path },
    ];

    return (
      <ContentPage
        title={page.title}
        intro={page.intro}
        sections={page.sections}
        updated={legal ? t("legal.updated", { date: LAST_UPDATED }) : undefined}
        footer={
          mainCta && (
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl bg-beige p-6 sm:flex-row sm:items-center">
              <p className="font-semibold">{page.description}</p>
              <Link href={mainCta.href} className="btn-cta shrink-0">
                {t(mainCta.labelKey)}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          )
        }
        secondary={
          <>
            {extraLink && (
              <Link href={extraLink.href} className="mt-4 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                {t(extraLink.labelKey)}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
            )}
            {sellService && (
              <div className="mt-12">
                <DubaiAreas locale={locale} variant="sell" />
              </div>
            )}
            {page.faqs?.length ? (
              <section className="mt-14">
                <h2 className="text-xl font-extrabold">{t("common.faq")}</h2>
                <dl className="mt-3 divide-y divide-border border-y border-border">
                  {page.faqs.map(({ q, a }) => (
                    <div key={q} className="py-4">
                      <dt className="font-semibold">{q}</dt>
                      <dd className="mt-1 text-ink/80">{a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </>
        }
      >
        <JsonLd
          data={[
            webPageSchema(locale, schemaType, {
              name: page.title,
              description: page.description,
              path,
              ...(legal && { dateModified: LAST_UPDATED }),
              ...(sellService && { mainEntity: `${siteUrl(locale, path)}#service` }),
            }),
            breadcrumbSchema(locale, crumbs),
            ...(sellService ? [sellServiceSchema(locale, page.title, page.description, path)] : []),
            ...(page.faqs?.length ? [faqSchema(page.faqs)] : []),
          ]}
        />
        <div className="-mt-4 mb-6">
          <Breadcrumbs items={crumbs} />
        </div>
      </ContentPage>
    );
  }

  return { generateMetadata, Page };
}
