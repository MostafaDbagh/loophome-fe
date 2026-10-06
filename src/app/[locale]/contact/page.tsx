import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhatsAppIcon } from "@/components/icons";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { liveFaqs, type FaqEntry } from "@/content/pages";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings, servicesOn, type PublicSettings } from "@/lib/api";
import { listOf, metaPrice, storeHours } from "@/lib/format";
import { cityName } from "@/lib/ui";
import { routes } from "@/lib/seo/config";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbSchema, faqSchema, JsonLd, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta2" });
  const tc = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: routes.contact, title: t("contact"), description: contactDescription(tc, locale, await getSettings(locale)) });
}

/** "…about an order, selling your items, a move or a technician visit", naming only what's on. */
function contactDescription(t: (key: string, values?: Record<string, string>) => string, locale: Locale, settings: PublicSettings | null) {
  const on = servicesOn(settings);
  const topics = [on.store && t("topicOrder"), t("topicSelling"), on.moving && t("topicMove"), on.technician && t("topicTechnician")].filter(
    (x): x is string => !!x,
  );
  return t("description", { topics: listOf(topics, locale, "disjunction") });
}

/** A link inside a translated sentence (t.rich). */
function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold underline underline-offset-2">
      {children}
    </Link>
  );
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const ts = await getTranslations({ locale, namespace: "sell" });
  const settings = await getSettings(locale);
  const store = settings?.store;
  const on = servicesOn(settings);
  const storeOn = on.store;
  const buying = on.sellToUs;
  const d = settings?.delivery;
  // The fee depends on the emirate: the amounts are listed once the admin has set any.
  const anyFee = !!d?.enabled && (d.defaultFee > 0 || d.cityFees.some((c) => c.fee > 0));
  const fees = anyFee
    ? [...d.cityFees.map((c) => `${cityName(c.city, locale)} ${metaPrice(c.fee, d.currency, locale)}`), `${t("otherEmirates")} ${metaPrice(d.defaultFee, d.currency, locale)}`].join(locale === "ar" ? "، " : ", ")
    : "";
  const servicePrices = (settings?.services ?? [])
    .map((s) => `${s.name} ${s.fee === 0 ? tc("free") : metaPrice(s.fee, d?.currency ?? "AED", locale)}`)
    .join(locale === "ar" ? "، " : ", ");
  const faq = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`q${n}`),
    a:
      n === 2
        ? [t("a2"), fees && t("feesAre", { fees }), d?.enabled && d.freeOver != null && t("freeOver", { amount: metaPrice(d.freeOver, d.currency, locale) })]
            .filter(Boolean)
            .join(" ")
        : n === 3 && servicePrices
          ? `${t("a3")} ${t("servicePrices", { prices: servicePrices })}`
          : t(`a${n}`, { hours: REPORT_WINDOW_HOURS }),
  }));
  // Seller answers worded as on /sell (FAQPage markup stays on /sell only); while buying is paused only those without a buying promise remain.
  const sellerFaq = liveFaqs(ts.raw("faqs") as FaqEntry[], on, ["offerTime", "freePickup", "permit", "payment", "noObligation", "list"]);
  const shownFaq = [...(storeOn ? faq : []), ...sellerFaq];

  const cards = [
    store?.phone && { icon: Phone, label: t("call"), value: store.phone, href: `tel:${store.phone}`, ltr: true },
    store?.email && { icon: Mail, label: t("email"), value: store.email, href: `mailto:${store.email}`, ltr: true },
    store?.address && { icon: MapPin, label: t("address"), value: store.address },
    store?.hours && { icon: Clock, label: t("hours"), value: storeHours(store.hours, locale) },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; ltr?: boolean }[];

  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tm("contact"), path: routes.contact },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <JsonLd
        data={[
          webPageSchema(locale, "ContactPage", { name: t("title"), description: contactDescription(t, locale, settings), path: routes.contact }),
          breadcrumbSchema(locale, crumbs),
          ...(storeOn ? [faqSchema(faq)] : []),
        ]}
      />

      <Breadcrumbs items={crumbs} />
      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink/80">{t(storeOn ? "intro" : "introSell")}</p>
      </header>

      {store?.whatsapp && (
        <WhatsAppLink
          phone={store.whatsapp}
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
        </WhatsAppLink>
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

      <section className="mt-14" aria-labelledby="send-heading">
        <h2 id="send-heading" className="text-2xl font-extrabold">
          {t("sendTitle")}
        </h2>
        <p className="mt-3 text-ink/80">{t("sendIntro")}</p>
        <ul className="mt-3 list-disc space-y-2 ps-6 text-ink/80">
          {(t.raw(buying ? "send" : "sendList") as string[]).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-ink/80">{t.rich("sendForm", { sell: (chunks) => <InlineLink href={routes.sell}>{chunks}</InlineLink> })}</p>
      </section>

      <section className="mt-14" aria-labelledby="where-heading">
        <h2 id="where-heading" className="text-2xl font-extrabold">
          {t("whereTitle")}
        </h2>
        {/* The areas link only while buying: the area pages are about selling to us. */}
        <p className="mt-3 text-ink/80">
          {t.rich(buying ? "whereText" : "whereTextList", { areas: (chunks) => <InlineLink href={routes.areas}>{chunks}</InlineLink> })}
        </p>
      </section>

      {/* Buying answers (payment, delivery, returns, pickup) only while the store is open; seller answers always. */}
      <section className="mt-14">
        <h2 className="text-2xl font-extrabold">{t("faqTitle")}</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {shownFaq.map(({ q, a }) => (
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
