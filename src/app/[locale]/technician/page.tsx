import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Money } from "@/components/Money";
import { TechnicianForm } from "@/components/TechnicianForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, technicianServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/technician">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const settings = await getSettings(locale);
  if (!settings?.technician?.enabled) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: routes.technician, title: t("meta2.technician"), description: t("technician.description") });
}

export default async function TechnicianPage({ params }: PageProps<"/[locale]/technician">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const technician = (await getSettings(locale))?.technician;
  if (!technician?.enabled) notFound();

  const t = await getTranslations({ locale, namespace: "technician" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const steps = t.raw("steps") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("technician"), path: routes.technician },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: t("h1"), description: t("description"), path: routes.technician }),
          technicianServiceSchema(locale, t("h1"), t("description"), technician.types, technician.visitFee, technician.currency),
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
          {technician.types.map((type) => (
            <li key={type.key} id={type.key.replace(/_/g, "-")} className="scroll-mt-20 rounded-xl border border-border bg-surface p-4">
              <h3 className="flex items-center gap-2 font-bold">
                <Check aria-hidden className="size-4 shrink-0" />
                {type.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{type.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href={routes.category("appliances-electronics")} className="font-semibold underline underline-offset-2">
            {t("browseAppliances")}
          </Link>
        </p>
      </section>

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
