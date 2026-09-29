import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { serviceIcon } from "@/components/icons";
import { MovingForm } from "@/components/MovingForm";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/api";
import { Money } from "@/components/Money";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, movingServiceSchema, webPageSchema } from "@/lib/seo/jsonld";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/moving">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const settings = await getSettings(locale);
  if (!settings?.moving?.enabled) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: routes.moving, title: t("meta2.moving"), description: t("moving.description") });
}

export default async function MovingPage({ params }: PageProps<"/[locale]/moving">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const moving = (await getSettings(locale))?.moving;
  if (!moving?.enabled) notFound();

  const t = await getTranslations({ locale, namespace: "moving" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const steps = t.raw("steps") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("moving"), path: routes.moving },
  ];
  const prices = (["home", "office"] as const)
    .filter((k) => moving.startingFrom[k] != null)
    .map((k) => (
      <span key={k}>
        {t.rich("startingFrom", {
          kind: t(k),
          amount: () => <Money amount={moving.startingFrom[k]!} currency={moving.currency} locale={locale} />,
        })}
      </span>
    ));

  return (
    <div className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={[
          webPageSchema(locale, "WebPage", { name: t("h1"), description: t("description"), path: routes.moving }),
          movingServiceSchema(locale, t("serviceName"), t("description"), moving),
          breadcrumbSchema(locale, crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <header className="grid gap-6 pb-10 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t("intro")}</p>
          {prices.length > 0 && <p className="mt-3 flex flex-wrap gap-x-4 font-semibold">{prices}</p>}
        </div>
        <a href="#request" className="btn-cta px-6! py-3.5!">
          {t("cta")}
        </a>
      </header>

      <section className="rounded-xl bg-beige p-6 sm:p-8">
        <h2 className="text-xl font-extrabold">{t("stepsTitle")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              <span className="font-medium">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {moving.services.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold">{t("servicesTitle")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {moving.services.map((s) => {
              const Icon = serviceIcon(s.key);
              return (
                <li key={s.key} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-beige">
                    <Icon aria-hidden className="size-6" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-semibold">{s.label}</span>
                    <span className="block text-sm text-muted">{s.description}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section id="request" className="mt-12 scroll-mt-20">
        <MovingForm moving={moving} />
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
