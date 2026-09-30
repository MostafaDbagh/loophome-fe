import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComingSoonPage } from "@/components/ComingSoon";
import { DubaiAreas } from "@/components/DubaiAreas";
import { CategoryPosts } from "@/components/blog/CategoryPosts";
import { serviceIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import { TechnicianForm } from "@/components/TechnicianForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings, shopEnabled } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, technicianServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/technician">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const settings = await getSettings(locale);
  const t = await getTranslations({ locale });
  // Switched off: the page stays ("coming soon") but out of the index until it's back.
  return pageMetadata({
    locale,
    path: routes.technician,
    title: t("meta2.technician"),
    description: t("technician.description"),
    noindex: !settings?.technician?.enabled,
  });
}

export default async function TechnicianPage({ params }: PageProps<"/[locale]/technician">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const settings = await getSettings(locale);
  const technician = settings?.technician;

  const t = await getTranslations({ locale, namespace: "technician" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("technician"), path: routes.technician },
  ];
  if (!technician?.enabled) return <ComingSoonPage title={t("h1")} intro={t("intro")} crumbs={crumbs} />;
  const steps = t.raw("steps") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: t("h1"), description: t("description"), path: routes.technician, mainEntity: `${siteUrl(locale, routes.technician)}#service` }),
          technicianServiceSchema(locale, t("serviceName"), t("description"), technician.types, technician.visitFee, technician.currency),
          breadcrumbSchema(locale, crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <header className="grid gap-6 pb-10 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t("intro")}</p>
          <p className="mt-3 font-semibold">
            {technician.visitFee != null
              ? t.rich("visitFee", { amount: () => <Money amount={technician.visitFee!} currency={technician.currency} locale={locale} /> })
              : t("noFee")}
          </p>
        </div>
        <a href="#request" className="btn-cta px-6! py-3.5!">
          {t("cta")}
        </a>
      </header>

      <section>
        <h2 className="text-xl font-extrabold">{t("servicesTitle")}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {technician.types.map((type) => {
            const Icon = serviceIcon(type.key);
            return (
              <li
                key={type.key}
                id={type.key.replace(/_/g, "-")}
                className="flex scroll-mt-20 items-start gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-beige">
                  <Icon aria-hidden className="size-6" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-bold">{type.name}</h3>
                  <p className="mt-1 text-sm text-muted">{type.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {shopEnabled(settings) && (
          <p className="mt-4">
            <Link href={routes.category("appliances-electronics")} className="font-semibold underline underline-offset-2">
              {t("browseAppliances")}
            </Link>
          </p>
        )}
      </section>

      <div className="mt-12">
        <DubaiAreas locale={locale} variant="technician" />
      </div>

      <section className="mt-10 rounded-xl bg-beige p-6 sm:p-8">
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
        <TechnicianForm technician={technician} />
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-2">
        {(t.raw("guide") as { heading: string; body: string }[]).map((g) => (
          <div key={g.heading}>
            <h2 className="text-xl font-extrabold">{g.heading}</h2>
            <p className="mt-2 leading-relaxed text-ink/80">{g.body}</p>
          </div>
        ))}
      </section>

      <CategoryPosts locale={locale} category="home-services" />

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
