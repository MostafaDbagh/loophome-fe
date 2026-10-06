import { ArrowRight, Check, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComingSoonPage } from "@/components/ComingSoon";
import { WhatsAppIcon } from "@/components/icons";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { AREA_COPY, AREA_SLUGS, AREAS, isAreaSlug } from "@/content/areas";
import { liveFaqs, type FaqEntry } from "@/content/pages";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlogSitemap, getSettings, sellToUsOn, servicesOn } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { areaPagePlace, breadcrumbSchema, JsonLd, sellServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { notFoundMetadata, pageMetadata, siteUrl } from "@/lib/seo/metadata";

// Any slug not in content/areas.ts is a 404 via notFound() below. Not `dynamicParams = false`: with it,
// next start answers 404 for every area once /api/revalidate expires the cache, until the next deploy.
export function generateStaticParams() {
  return AREA_SLUGS.map((area) => ({ area }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/areas/[area]">): Promise<Metadata> {
  const { locale: lang, area: slug } = await params;
  const locale = lang as Locale;
  if (!isAreaSlug(slug)) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const copy = AREA_COPY[locale];
  const name = AREAS[slug].name[locale];
  // The area pages exist only to sell to LoopHome: while that's paused they're "coming soon", out of the index.
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations({ locale })]);
  if (!sellToUsOn(settings)) {
    return pageMetadata({ locale, path: routes.area(slug), title: copy.title(name), description: t("soon.sellToUsOff"), noindex: true });
  }
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
  const settings = await getSettings(locale);
  // The page is about selling to LoopHome: while the owner has that paused it's "coming soon", without the
  // WhatsApp sell button, the offer link or the selling sections.
  if (!sellToUsOn(settings)) return <ComingSoonPage title={h1} intro={t("soon.sellToUsOff")} crumbs={crumbs} sellToUsOn={false} />;
  // A blog API hiccup must not take the page down: the guide link is just left out.
  const posts = area.guide
    ? await getBlogSitemap().catch((err) => {
        unstable_rethrow(err);
        return [];
      })
    : [];
  const guide = posts.some((p) => p.slug === area.guide) ? area.guide : undefined;
  const whatsapp = settings?.store?.whatsapp;
  // Two of the /sell answers, worded as there (FAQPage markup stays on /sell only).
  const faqs = liveFaqs(t.raw("sell.faqs") as FaqEntry[], servicesOn(settings), ["payment", "noObligation"]);
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
            <WhatsAppLink phone={whatsapp} text={copy.whatsapp(name)} className="btn-whatsapp">
              <WhatsAppIcon className="size-5" />
              {t("contact.whatsapp")}
            </WhatsAppLink>
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

      <section className="border-t border-border py-8">
        <h2 className="text-xl font-extrabold">{copy.tipsTitle(name)}</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 leading-relaxed text-ink/80">
          {area.tips[locale].map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-10 border-t border-border py-8 sm:grid-cols-2">
        <section>
          <h2 className="text-xl font-extrabold">{copy.howTitle}</h2>
          <ol className="mt-4 space-y-3">
            {copy.how.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-extrabold">{copy.whatTitle}</h2>
          <ul className="mt-4 space-y-2.5">
            {(t.raw("sell.what") as string[]).slice(0, 3).map((w) => (
              <li key={w} className="flex items-start gap-2.5">
                <Check aria-hidden className="mt-0.5 size-5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border-t border-border py-8">
        <h2 className="text-xl font-extrabold">{t("sell.faqTitle")}</h2>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          {faqs.map(({ q, a }) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-ink/80">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label={t("sell.moreWays")} className="grid gap-3 border-t border-border py-8 sm:grid-cols-2">
        {[
          { href: routes.sellMovingOut, label: t("sell.movingOutLink") },
          { href: routes.sellAppliances, label: t("sell.appliancesLink") },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-xl bg-beige p-5 font-semibold transition hover:bg-beige-dark">
            {l.label}
            <ArrowRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
          </Link>
        ))}
      </nav>

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
