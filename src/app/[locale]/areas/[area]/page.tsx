import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WhatsAppIcon } from "@/components/icons";
import { AREA_COPY, AREA_SLUGS, AREAS, isAreaSlug } from "@/content/areas";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlogSitemap, getSettings } from "@/lib/api";
import { whatsappUrl } from "@/lib/format";
import { routes } from "@/lib/seo/config";
import { areaPagePlace, breadcrumbSchema, JsonLd, sellServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

/** Only the areas in content/areas.ts have a page; any other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return AREA_SLUGS.map((area) => ({ area }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/areas/[area]">): Promise<Metadata> {
  const { locale: lang, area: slug } = await params;
  const locale = lang as Locale;
  if (!isAreaSlug(slug)) return {};
  const copy = AREA_COPY[locale];
  const name = AREAS[slug].name[locale];
  return pageMetadata({ locale, path: routes.area(slug), title: copy.title(name), description: copy.description(name) });
}

export default async function AreaPage({ params }: PageProps<"/[locale]/areas/[area]">) {
  const { locale: lang, area: slug } = await params;
  const locale = lang as Locale;
  if (!isAreaSlug(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const area = AREAS[slug];
  const copy = AREA_COPY[locale];
  const name = area.name[locale];
  const path = routes.area(slug);
  const h1 = copy.h1(name);
  const description = copy.description(name);
  const crumbs = [
    { name: t("meta.breadcrumb.home"), path: routes.home },
    { name: copy.index.h1, path: routes.areas },
    { name, path },
  ];
  const [settings, posts] = await Promise.all([
    getSettings(locale),
    // A blog API hiccup must not take the page down: the guide link is just left out.
    area.guide
      ? getBlogSitemap().catch((err) => {
          unstable_rethrow(err);
          return [];
        })
      : [],
  ]);
  const guide = posts.some((p) => p.slug === area.guide) ? area.guide : undefined;
  const whatsapp = settings?.store?.whatsapp;
  const chip = "inline-flex items-center gap-1.5 rounded-full border border-ink/40 bg-surface px-3.5 py-2 text-sm font-medium transition hover:border-ink";

  return (
    <div className="mx-auto max-w-3xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: h1, description, path, mainEntity: `${siteUrl(locale, path)}#service` }),
          sellServiceSchema(locale, h1, description, path, [areaPagePlace(area.name, locale)]),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-8 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">{copy.intro(name)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsapp && (
            <a href={whatsappUrl(whatsapp, copy.whatsapp(name))} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <WhatsAppIcon className="size-5" />
              {t("contact.whatsapp")}
            </a>
          )}
          <Link href={routes.sell} className="btn-cta">
            {t("sell.getOffer")}
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </header>

      <section className="border-t border-border py-8">
        <h2 className="text-xl font-extrabold">{copy.about(name)}</h2>
        <p className="mt-3 leading-relaxed text-ink/80">{area.local[locale]}</p>
        {guide && (
          <Link href={routes.post(guide)} className="mt-4 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            {copy.guide(name)}
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        )}
      </section>

      <nav aria-labelledby="nearby" className="border-t border-border py-8">
        <h2 id="nearby" className="text-xl font-extrabold">
          {copy.near}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {area.near.map((near) => (
            <li key={near}>
              <Link href={routes.area(near)} className={chip}>
                <MapPin aria-hidden className="size-4 text-muted" />
                {AREAS[near].name[locale]}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={routes.areas} className="mt-6 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          {copy.index.all}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </nav>
    </div>
  );
}
