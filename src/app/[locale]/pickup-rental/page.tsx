import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClientMessages } from "@/components/ClientMessages";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComingSoonPage } from "@/components/ComingSoon";
import { Money } from "@/components/Money";
import { PickupRentalForm } from "@/components/PickupRentalForm";
import type { Locale } from "@/i18n/routing";
import { getSettings, sellToUsOn } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, pickupRentalServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/pickup-rental">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const settings = await getSettings(locale);
  const t = await getTranslations({ locale });
  // Switched off: the page stays ("coming soon") but out of the index until it's back.
  return pageMetadata({
    locale,
    path: routes.pickupRental,
    title: t("meta2.pickupRental"),
    description: t("pickupRental.description"),
    noindex: !settings?.pickupRental?.enabled,
  });
}

export default async function PickupRentalPage({ params }: PageProps<"/[locale]/pickup-rental">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const settings = await getSettings(locale);
  const rental = settings?.pickupRental;

  const t = await getTranslations({ locale, namespace: "pickupRental" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("pickupRental"), path: routes.pickupRental },
  ];
  // Off: the hours and worker numbers may not be set, so the coming-soon page uses the plain description.
  if (!rental?.enabled) return <ComingSoonPage title={t("h1")} intro={t("description")} crumbs={crumbs} sellToUsOn={sellToUsOn(settings)} />;
  const hours = rental.hours;
  const steps = t.raw("steps") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const money = (amount: number) => <Money amount={amount} currency={rental.currency} locale={locale} />;

  return (
    <div className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: t("h1"), description: t("description"), path: routes.pickupRental, mainEntity: `${siteUrl(locale, routes.pickupRental)}#service` }),
          pickupRentalServiceSchema(locale, t("serviceName"), t("description"), t("offerName", { hours }), rental),
          breadcrumbSchema(locale, crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <header className="grid gap-6 pb-10 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t("intro", { hours, max: rental.maxWorkers })}</p>
          <p className="mt-3 font-semibold">
            {rental.basePrice != null
              ? t.rich("price", { hours, base: () => money(rental.basePrice!), worker: () => money(rental.workerPrice) })
              : t.rich("priceOnRequest", { hours, worker: () => money(rental.workerPrice) })}
          </p>
        </div>
        <a href="#request" className="btn-cta px-6! py-3.5!">
          {t("cta")}
        </a>
      </header>

      <section className="rounded-xl bg-beige p-6 sm:p-8">
        <h2 className="text-xl font-extrabold">{t("stepsTitle")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              <span className="font-medium">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="request" className="mt-12 scroll-mt-20">
        <ClientMessages namespaces={["pickupRental"]}>
          <PickupRentalForm rental={rental} />
        </ClientMessages>
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-2">
        {(t.raw("guide") as { heading: string; body: string }[]).map((g) => (
          <div key={g.heading}>
            <h2 className="text-xl font-extrabold">{g.heading}</h2>
            <p className="mt-2 leading-relaxed text-ink/80">{g.body}</p>
          </div>
        ))}
      </section>

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
