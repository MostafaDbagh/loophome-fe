import { BadgeCheck, Check, CircleAlert, RotateCcw, ShieldQuestion, ShieldCheck, Truck, Wrench, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConditionBadge } from "@/components/ConditionBadge";
import { PriceTag } from "@/components/PriceTag";
import { ProductActions } from "@/components/ProductActions";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductGrid";
import { Money } from "@/components/Money";
import { ProductMeta } from "@/components/ProductMeta";
import { ShareButton } from "@/components/ShareButton";
import { UncheckedBadge } from "@/components/UncheckedBadge";
import { ViewBeacon } from "@/components/ViewBeacon";
import { SampleNotice, SectionHeading } from "@/components/Section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProduct, getSettings } from "@/lib/api";
import { hasFreeDelivery, serviceFee, servicesFor } from "@/lib/fees";
import { isArabic, metaPrice, textLang } from "@/lib/format";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";
import { routes } from "@/lib/seo/config";
import { breadcrumbSchema, itemCondition, itemPageSchema, JsonLd, productSchema } from "@/lib/seo/jsonld";
import { clip, notFoundMetadata, ogImage, pageMetadata, siteUrl } from "@/lib/seo/metadata";

// Rendered on first visit, then cached and refreshed at most once a minute (ISR).
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

// One API call per render for both metadata and page.
const load = cache((locale: Locale, slug: string) => getProduct(locale, slug));

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const product = await load(locale, slug);
  if (!product) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  const t = await getTranslations({ locale, namespace: "meta.product" });
  const tc = await getTranslations({ locale, namespace: "conditions" });
  const owner = product.inspected === false;
  const vars = {
    title: product.title,
    condition: tc(product.condition),
    price: metaPrice(product.price, product.currency, locale),
  };
  // UAE-targeted title when it fits in ~60 chars. On English pages an Arabic-only item name
  // gets the English category in front; Arabic pages keep English names (normal in UAE search).
  function productTitle() {
    const isNew = product!.condition === "new";
    if (locale === "en" && isArabic(product!.title) && product!.category) {
      return t("titleMixed", { ...vars, category: product!.category.name });
    }
    const uae = t(isNew ? "titleNewUae" : "titleUae", vars);
    return uae.length <= 60 ? uae : t(isNew ? "titleNew" : "title", vars);
  }
  const meta = pageMetadata({
    locale,
    path: routes.product(product.slug),
    title: productTitle(),
    absoluteTitle: true,
    type: null,
    // Add the item's own text only when it's in this page's language (titles aren't translated yet).
    description: clip(
      isArabic(product.description) === (locale === "ar")
        ? `${t(owner ? "descriptionOwner" : "description", vars)} ${product.description}`
        : t(owner ? "descriptionOwner" : "description", vars),
    ),
    // One image: WhatsApp and X use only the first, and it must be small enough to show.
    images: product.photos.slice(0, 1).map((p) => ({ ...ogImage(p.url), alt: product.title })),
    // Sold items stay reachable for old links but drop out of search.
    noindex: product.status === "sold" || !!product.sample,
  });
  return meta;
}

export default async function ProductPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  setRequestLocale(locale);
  const product = await load(locale, slug);
  if (!product) notFound();
  // One URL per product: /products/HL-000002 → /products/hl-000002
  if (decodeURIComponent(slug) !== product.slug) permanentRedirect(`/${locale}${routes.product(product.slug)}`);

  const t = await getTranslations({ locale, namespace: "product" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tp = await getTranslations({ locale, namespace: "product" });
  const owner = product.inspected === false;
  const tFooter = await getTranslations({ locale, namespace: "nav" });
  const settings = await getSettings(locale);
  const services = servicesFor(product, settings);
  const freeDelivery = hasFreeDelivery(product, settings);
  const freeServices = services.filter((s) => serviceFee(s, product) === 0);
  const d = settings?.delivery;
  const fees = d?.enabled && d.currency === product.currency ? [d.defaultFee, ...d.cityFees.map((c) => c.fee)] : [];
  const minFee = fees.length ? Math.min(...fees) : null;
  const maxFee = fees.length ? Math.max(...fees) : null;
  const price = (n: number) => (
    <bdi className="whitespace-nowrap">
      <Money amount={n} currency={product.currency} locale={locale} />
    </bdi>
  );

  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tm("store"), path: routes.store },
    ...(product.category ? [{ name: product.category.name, path: routes.category(product.category.slug) }] : []),
    { name: product.title, path: routes.product(product.slug) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {!product.sample && (
        <JsonLd
          data={[itemPageSchema(locale, product), productSchema(locale, product, settings), breadcrumbSchema(locale, crumbs)]}
        />
      )}
      {product.sample && <SampleNotice text={tc("sample")} />}

      {/* Product price tags for Facebook/Instagram/Pinterest previews (React hoists <meta> into <head>). */}
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content={product.currency} />
      <meta property="product:availability" content={product.status === "active" ? "in stock" : "out of stock"} />
      <meta property="product:condition" content={itemCondition(product)} />
      {product.ref && <meta property="product:retailer_item_id" content={product.ref} />}
      {!product.sample && <ViewBeacon productId={product.id} />}
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery photos={product.photos} title={product.title} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`${routes.conditionGrades}#${product.condition}`} title={tp("conditionGuide")}>
                <ConditionBadge condition={product.condition} />
              </Link>
              {owner && <UncheckedBadge />}
              {product.category && (
                <Link
                  href={routes.category(product.category.slug)}
                  className="rounded-sm bg-beige px-2 py-0.5 text-xs font-semibold text-ink hover:bg-beige-dark"
                >
                  {product.category.name}
                </Link>
              )}
              {product.negotiable && (
                <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-ink">
                  {tc("negotiable")}
                </span>
              )}
            </div>
            <h1 lang={textLang(product.title)} className="ugc text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{product.title}</h1>
            <PriceTag product={product} size="lg" />
            <ProductMeta product={product} className="text-sm" />
          </div>

          {product.status !== "active" && (
            <p className="rounded-2xl bg-beige p-4 font-semibold text-ink">
              {product.status === "sold" ? t("unavailableSold") : t("unavailableReserved")}
            </p>
          )}

          {(freeDelivery || freeServices.length > 0) && (
            <ul className="flex flex-wrap gap-2">
              {freeDelivery && (
                <li className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-2.5 py-1 text-sm font-semibold text-white">
                  <Truck className="size-4" />
                  {t("freeDelivery")}
                </li>
              )}
              {freeServices.map((s) => (
                <li key={s.key} className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-2.5 py-1 text-sm font-semibold text-white">
                  <BadgeCheck aria-hidden className="size-4" />
                  {t("freeService", { service: s.name })}
                </li>
              ))}
            </ul>
          )}

          {owner && (
            <div role="note" className="rounded-xl border border-ink/15 bg-surface p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldQuestion aria-hidden className="size-4" />
                {t("uncheckedTitle")}
              </p>
              <p className="mt-1.5 leading-relaxed text-ink/80">
                {t("uncheckedText")}{" "}
                <Link href={`${routes.terms}#owner-listings`} className="underline underline-offset-2">
                  {tFooter("terms")}
                </Link>
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <ProductActions product={product} size="lg" />
            </div>
            <ShareButton url={siteUrl(locale, routes.product(product.slug))} title={product.title} />
          </div>

          {/* One row per promise: icon + title + muted subtitle, stacked at every width. */}
          <ul className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 text-sm">
            <InfoRow
              icon={Truck}
              title={
                freeDelivery
                  ? t("freeDelivery")
                  : minFee == null
                    ? t("deliveryTitle")
                    : minFee === maxFee
                      ? t.rich("deliveryTitleFrom", { amount: () => price(minFee) })
                      : t.rich("deliveryTitleRange", { min: () => price(minFee), max: () => price(maxFee!) })
              }
              sub={freeDelivery ? t("freeDeliverySub") : minFee != null && minFee !== maxFee ? t("deliverySubRange") : t("deliverySub")}
            />
            {/* TODO(user): returns for owner listings aren't confirmed yet, so the promise shows on our own items only. */}
            {!owner && (
              <InfoRow
                icon={RotateCcw}
                title={
                  <Link href={`${routes.terms}#returns`} className="underline underline-offset-2">
                    {t("returnsTitle", { hours: REPORT_WINDOW_HOURS })}
                  </Link>
                }
                sub={t("returnsSub")}
              />
            )}
            {owner ? (
              <InfoRow icon={CircleAlert} title={t("noWarrantyOwner")} sub={t("noWarrantyOwnerSub")} />
            ) : product.warrantyDays > 0 ? (
              <InfoRow icon={ShieldCheck} title={t("warranty", { days: product.warrantyDays })} sub={t("warrantySub")} />
            ) : null}
          </ul>

          {services.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">{t("servicesAvailable")}</h2>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                {services.map((s) => (
                  <li key={s.key} className="flex items-center justify-between px-4 py-3">
                    <span>{s.name}</span>
                    <span className="font-semibold">
                      {serviceFee(s, product) === 0 ? tc("free") : <Money amount={serviceFee(s, product)} currency={product.currency} locale={locale} />}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.highlights.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <Wrench className="size-5 text-ink" />
                {owner ? t("highlightsOwner") : t("highlights")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {product.highlights.map((h) => (
                  <li key={h} className="ugc inline-flex items-center gap-1.5 rounded-full bg-beige px-3 py-1 text-sm font-semibold text-ink">
                    <Check aria-hidden className="size-3.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-lg font-bold">{t("description")}</h2>
            <p lang={textLang(product.description)} className="ugc whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
          </div>
        </div>
      </div>

      {product.similar.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            title={t("similar")}
            href={product.category ? routes.category(product.category.slug) : routes.store}
            linkLabel={tc("viewAll")}
          />
          <ProductGrid products={product.similar.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, title, sub }: { icon: LucideIcon; title: React.ReactNode; sub: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{sub}</p>
      </div>
    </li>
  );
}
