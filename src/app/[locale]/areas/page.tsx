import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComingSoonPage } from "@/components/ComingSoon";
import { AREA_COPY, AREA_SLUGS, AREAS } from "@/content/areas";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings, sellToUsOn } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, JsonLd, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/areas">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const { title, description } = AREA_COPY[locale].index;
  // The area pages exist only to sell to LoopHome: while that's paused this is "coming soon", out of the index.
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations({ locale })]);
  const buying = sellToUsOn(settings);
  return pageMetadata({ locale, path: routes.areas, title, description: buying ? description : t("soon.sellToUsOff"), noindex: !buying });
}

/** First sentence of an area's text, as the teaser on its card. */
const firstSentence = (text: string) => text.match(/^.+?\.(?=\s|$)/)?.[0] ?? text;

export default async function AreasPage({ params }: PageProps<"/[locale]/areas">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const copy = AREA_COPY[locale].index;
  const crumbs = [
    { name: t("meta.breadcrumb.home"), path: routes.home },
    { name: copy.h1, path: routes.areas },
  ];
  // Selling to LoopHome paused: "coming soon". The settings fetch (cache tag "api") lets the page follow the admin switch.
  if (!sellToUsOn(await getSettings(locale))) return <ComingSoonPage title={copy.h1} intro={t("soon.sellToUsOff")} crumbs={crumbs} sellToUsOn={false} />;

  return (
    <div className="mx-auto max-w-5xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: copy.h1, description: copy.description, path: routes.areas }),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-8 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{copy.h1}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">{copy.intro}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREA_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={routes.area(slug)}
              className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition hover:border-ink"
            >
              <span className="flex items-center gap-2 text-lg font-bold">
                <MapPin aria-hidden className="size-5 shrink-0 text-muted" />
                {AREAS[slug].name[locale]}
              </span>
              <span className="text-sm leading-relaxed text-ink/70">{firstSentence(AREAS[slug].local[locale])}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl bg-beige p-6 sm:flex-row sm:items-center">
        <p className="font-semibold">{copy.description}</p>
        <Link href={routes.sell} className="btn-cta shrink-0">
          {t("sell.getOffer")}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
