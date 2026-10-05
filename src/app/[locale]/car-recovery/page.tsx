import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClientMessages } from "@/components/ClientMessages";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CarRecoveryForm } from "@/components/CarRecoveryForm";
import { ComingSoonPage } from "@/components/ComingSoon";
import { Money } from "@/components/Money";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, carRecoveryServiceSchema, faqSchema, JsonLd, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/car-recovery">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const settings = await getSettings(locale);
  const t = await getTranslations({ locale });
  // Switched off: the page stays ("coming soon") but out of the index until it's back.
  return pageMetadata({
    locale,
    path: routes.carRecovery,
    title: t("meta2.carRecovery"),
    description: t("carRecovery.description"),
    noindex: !settings?.carRecovery?.enabled,
  });
}

export default async function CarRecoveryPage({ params }: PageProps<"/[locale]/car-recovery">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const settings = await getSettings(locale);
  const recovery = settings?.carRecovery;

  const t = await getTranslations({ locale, namespace: "carRecovery" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("carRecovery"), path: routes.carRecovery },
  ];
  if (!recovery?.enabled) return <ComingSoonPage title={t("h1")} intro={t("intro")} crumbs={crumbs} />;
  const steps = t.raw("steps") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: t("h1"), description: t("description"), path: routes.carRecovery, mainEntity: `${siteUrl(locale, routes.carRecovery)}#service` }),
          carRecoveryServiceSchema(locale, t("serviceName"), t("description"), recovery.startingFrom, recovery.currency),
          breadcrumbSchema(locale, crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <header className="grid gap-6 pb-10 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t("intro")}</p>
          {/* Priced by distance: a "from" price only when the admin set one. */}
          <p className="mt-3 font-semibold">
            {recovery.startingFrom != null
              ? t.rich("startingFrom", { amount: () => <Money amount={recovery.startingFrom!} currency={recovery.currency} locale={locale} /> })
              : t("noPrice")}
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
        <ClientMessages namespaces={["carRecovery"]}>
          <CarRecoveryForm />
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
