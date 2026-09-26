import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhatsAppIcon } from "@/components/icons";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/api";
import { metaPrice, whatsappUrl } from "@/lib/format";
import { cityName } from "@/lib/ui";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, faqSchema, JsonLd, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta2" });
  const tc = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: routes.contact, title: t("contact"), description: tc("description") });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const settings = await getSettings(locale);
  const store = settings?.store;
  const d = settings?.delivery;
  const fees = d?.enabled
    ? [...d.cityFees.map((c) => `${cityName(c.city, locale)} ${metaPrice(c.fee, d.currency, locale)}`), `${t("otherEmirates")} ${metaPrice(d.defaultFee, d.currency, locale)}`].join(locale === "ar" ? "، " : ", ")
    : "";
  const servicePrices = (settings?.services ?? [])
    .map((s) => `${s.name} ${s.fee === 0 ? tc("free") : metaPrice(s.fee, d?.currency ?? "AED", locale)}`)
    .join(locale === "ar" ? "، " : ", ");
  const faq = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`q${n}`),
    a:
      n === 2 && fees
        ? `${t("a2")} ${t("feesAre", { fees })}${d?.freeOver != null ? ` ${t("freeOver", { amount: metaPrice(d.freeOver, d.currency, locale) })}` : ""}`
        : n === 3 && servicePrices
          ? `${t("a3")} ${t("servicePrices", { prices: servicePrices })}`
          : t(`a${n}`),
  }));

  const cards = [
    store?.phone && { icon: Phone, label: t("call"), value: store.phone, href: `tel:${store.phone}`, ltr: true },
    store?.email && { icon: Mail, label: t("email"), value: store.email, href: `mailto:${store.email}`, ltr: true },
    store?.address && { icon: MapPin, label: t("address"), value: store.address },
    store?.hours && { icon: Clock, label: t("hours"), value: store.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <JsonLd
        data={[
          webPageSchema(locale, "ContactPage", { name: t("title"), description: t("description"), path: routes.contact }),
          breadcrumbSchema(locale, [
            { name: tm("home"), path: routes.home },
            { name: tm("contact"), path: routes.contact },
          ]),
          faqSchema(faq),
        ]}
      />

      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink/80">{t("intro")}</p>
      </header>

      {store?.whatsapp && (
        <a
          href={whatsappUrl(store.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-between gap-4 rounded-xl bg-ink p-6 text-white transition hover:bg-ink-soft"
        >
          <span className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-white text-whatsapp-dark">
              <WhatsAppIcon className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-bold">{t("whatsapp")}</span>
              <span dir="ltr" className="block text-white/70">
                {store.whatsapp}
              </span>
            </span>
          </span>
        </a>
      )}

      {cards.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, label, value, href, ltr }) => (
            <li key={label} className="flex items-start gap-4 rounded-xl bg-beige p-5">
              <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="block text-sm text-muted">{label}</span>
                {href ? (
                  <a href={href} dir={ltr ? "ltr" : undefined} className="font-semibold hover:underline">
                    {value}
                  </a>
                ) : (
                  <span className="font-semibold">{value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold">{t("faqTitle")}</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {faq.map(({ q, a }) => (
            <div key={q} className="py-5">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1.5 text-ink/80">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
