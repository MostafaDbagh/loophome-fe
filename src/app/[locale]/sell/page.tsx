import { ArrowRight, Banknote, Check, Clock, Truck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClientMessages } from "@/components/ClientMessages";
import { DubaiAreas } from "@/components/DubaiAreas";
import { CategoryPosts } from "@/components/blog/CategoryPosts";
import { SellForm } from "@/components/SellForm";
import { liveFaqs, type FaqEntry } from "@/content/pages";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSettings, servicesOn } from "@/lib/api";
import { listingTerms } from "@/lib/listing";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, listingServiceSchema, sellServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/sell">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: "meta.sell" }), getSettings(locale)]);
  // Indexable in both states: while selling to LoopHome is paused, the page is about listing.
  const buying = servicesOn(settings).sellToUs;
  return pageMetadata({ locale, path: routes.sell, title: t(buying ? "title" : "titleList"), description: t(buying ? "description" : "descriptionList") });
}

export default async function SellPage({ params }: PageProps<"/[locale]/sell">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "sell" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const [categories, settings] = await Promise.all([getCategories(locale), getSettings(locale)]);
  // "Sell it to LoopHome" paused by the owner: the page offers listing only, without the buying promises.
  const on = servicesOn(settings);
  const buying = on.sellToUs;
  const h1 = t(buying ? "h1" : "h1List");
  const subtitle = t(buying ? "subtitle" : "subtitleList");
  const what = t.raw("what") as string[];
  const how = t.raw(buying ? "how" : "howList") as string[];
  const terms = listingTerms(settings);
  const number = (value: number) => new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", { maximumFractionDigits: 2 }).format(value);
  const values = terms && { days: number(terms.days), commission: number(terms.commissionPercent), price: number(terms.examplePrice), fee: number(terms.exampleCommission), proceeds: number(terms.exampleProceeds) };
  const faqs = [
    ...liveFaqs(t.raw("faqs") as FaqEntry[], on),
    ...(values ? [
      { q: t("listingInfo.feeQ"), a: t("listingInfo.feeA", values) },
      { q: t("listingInfo.durationQ"), a: t("listingInfo.durationA", values) },
      { q: t("listingInfo.inspectionQ"), a: t("listingInfo.inspectionA") },
      { q: t("listingInfo.paymentQ"), a: t("listingInfo.paymentA") },
    ] : []),
  ];
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tm(buying ? "sell" : "sellList"), path: routes.sell },
  ];

  const perks = [
    { icon: Truck, text: t("why1") },
    { icon: Clock, text: t("why2") },
    { icon: Banknote, text: t("why3") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: h1, description: subtitle, path: routes.sell, mainEntity: buying ? `${siteUrl(locale, routes.sell)}#service` : terms ? `${siteUrl(locale, routes.sell)}#listing-service` : undefined }),
          ...(buying ? [sellServiceSchema(locale, h1, subtitle)] : []),
          ...(terms ? [listingServiceSchema(locale, t("listingInfo.title"), t("subtitleList"))] : []),
          breadcrumbSchema(locale, crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-8 pt-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{h1}</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">{subtitle}</p>
        {/* Free pickup, an offer within 24 hours and cash on pickup are the buying service's terms. */}
        {buying && (
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold">
                <Icon aria-hidden className="size-4 text-ink" />
                {text}
              </li>
            ))}
          </ul>
        )}
      </header>

      {values && (
        <section aria-labelledby="listing-terms" className="mb-8 rounded-xl border border-border bg-beige p-5 sm:p-7">
          <h2 id="listing-terms" className="text-xl font-extrabold">{t("listingInfo.title")}</h2>
          <p className="mt-2 text-ink/80">{t("listingInfo.intro")}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            {(["price", "duration", "commission"] as const).map((key) => (
              <div key={key} className="rounded-lg bg-surface p-4">
                <dt className="text-sm text-muted">{t(`listingInfo.${key}Label`)}</dt>
                <dd className="mt-1 font-bold">{t(`listingInfo.${key}Value`, values)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-ink/80">{t("listingInfo.example", values)}</p>
          <p className="mt-2 text-sm text-ink/80">{t("listingInfo.confirm")}</p>
          <Link href={`${routes.terms}#owner-listings`} className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">{t("listingInfo.termsLink")}</Link>
        </section>
      )}

      <section id="request" className="scroll-mt-20">
        {/* SellForm reads "sell" and "conditions"; ConsentText reads "sell.privacy". */}
        <ClientMessages namespaces={["sell", "conditions"]}>
          <SellForm
            categories={categories}
            listing={settings?.listing}
            options={[
              ...(buying ? (["sell"] as const) : []),
              ...(settings?.listing && settings.listWithUs?.enabled !== false ? (["list"] as const) : []),
            ]}
            soonLabel={(await getTranslations({ locale, namespace: "soon" }))("tag")}
          />
        </ClientMessages>
      </section>

      <div className={`mt-16 grid gap-10 ${buying ? "sm:grid-cols-2" : ""}`}>
        {/* What LoopHome buys, and the appliance page it links to: only while it buys. */}
        {buying && (
          <section>
            <h2 className="text-xl font-extrabold">{t("whatTitle")}</h2>
            <ul className="mt-4 space-y-2.5">
              {what.map((w, i) => (
                <li key={w} className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-0.5 size-5 shrink-0" />
                  {/* The appliances line leads to its own sell page. */}
                  {i === 1 ? (
                    <Link href={routes.sellAppliances} className="underline underline-offset-2">
                      {w}
                    </Link>
                  ) : (
                    w
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h2 className="text-xl font-extrabold">{t("howTitle")}</h2>
          <ol className="mt-4 space-y-3">
            {how.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Both lead to pages about selling to us, which are "coming soon" while that's paused. */}
      {buying && (
        <nav aria-label={t("moreWays")} className="mt-12 grid gap-3 sm:grid-cols-2">
          {[
            { href: routes.sellMovingOut, label: t("movingOutLink") },
            { href: routes.sellAppliances, label: t("appliancesLink") },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-xl bg-beige p-5 font-semibold transition hover:bg-beige-dark">
              {l.label}
              <ArrowRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-12">
        <DubaiAreas locale={locale} variant="sell" />
      </div>

      <CategoryPosts locale={locale} category="selling" />

      <section className="mt-14">
        <h2 className="text-xl font-extrabold">{t("faqTitle")}</h2>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          {faqs.map(({ q, a }) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-ink/80">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
