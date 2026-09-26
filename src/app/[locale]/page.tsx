import { Camera, HandCoins, MessageCircle, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryCards } from "@/components/CategoryCards";
import { ProductGrid } from "@/components/ProductGrid";
import { SampleNotice, SectionHeading } from "@/components/Section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getFeed } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { homePageSchema, itemListSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return pageMetadata({ locale, path: routes.home, title: t("title"), description: t("description"), absoluteTitle: true });
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "meta.home" });
  const [feed, categories] = await Promise.all([getFeed(locale), getCategories(locale)]);
  const heroPhotos = feed.newArrivals.flatMap((p) => p.photos.slice(0, 1).map((ph) => ({ ...ph, alt: p.title }))).slice(0, 3);

  const steps = [
    {
      title: t("buyTitle"),
      items: [
        { icon: ShoppingBag, text: t("buy1") },
        { icon: MessageCircle, text: t("buy2") },
        { icon: Truck, text: t("buy3") },
      ],
    },
    {
      title: t("sellTitle"),
      items: [
        { icon: Camera, text: t("sell1") },
        { icon: MessageCircle, text: t("sell2") },
        { icon: PackageCheck, text: t("sell3") },
      ],
    },
  ];

  return (
    <>
      {!feed.sample && (
        <JsonLd
          data={[
            homePageSchema(locale, tm("title"), tm("description"), feed.newArrivals.length > 0),
            ...(feed.newArrivals.length ? [itemListSchema(locale, feed.newArrivals, t("newArrivals"), `${siteUrl(locale)}#items`)] : []),
          ]}
        />
      )}
      {feed.sample && <SampleNotice text={tc("sample")} />}

      {/* Hero: headline beside a photo collage on beige */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <div className="grid overflow-hidden rounded-xl bg-beige lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 p-7 sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t("badge")}</p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="max-w-md text-lg text-ink/70">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/store" className="btn-cta px-7! py-3.5!">
                <ShoppingBag className="size-5" />
                {t("shop")}
              </Link>
              <Link href="/sell" className="btn-ghost px-7! py-3.5!">
                <HandCoins className="size-5" />
                {t("sell")}
              </Link>
            </div>
          </div>
          {heroPhotos.length > 0 && (
            <div className="grid min-h-72 grid-cols-2 grid-rows-2 gap-2 p-2 lg:min-h-[28rem]">
              {heroPhotos.map((p, i) => (
                <div key={p.url} className={`relative overflow-hidden rounded-lg ${i === 0 ? "row-span-2" : ""}`}>
                  <Image
                    src={p.url}
                    alt={p.alt}
                    fill
                    // The first (tall) tile is the LCP image; the others load eagerly but without preload.
                    preload={i === 0}
                    fetchPriority={i === 0 ? "high" : "low"}
                    loading={i === 0 ? "eager" : "lazy"}
                    sizes={i === 0 ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 300px, 50vw"}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-14">
        <section>
          <SectionHeading title={t("categories")} />
          <CategoryCards categories={categories} />
        </section>

        <section>
          <SectionHeading title={t("newArrivals")} href="/store" linkLabel={tc("viewAll")} />
          {feed.newArrivals.length ? (
            <ProductGrid products={feed.newArrivals} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted">{t("empty")}</p>
          )}
        </section>

        {feed.bestDeals.length > 0 && (
          <section>
            <SectionHeading title={t("bestDeals")} href={routes.store} linkLabel={tc("viewAll")} />
            <ProductGrid products={feed.bestDeals.slice(0, 4)} />
          </section>
        )}

        <section>
          <SectionHeading title={t("howTitle")} />
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((group) => (
              <div key={group.title} className="rounded-xl border border-border bg-surface p-6 sm:p-8">
                <h3 className="text-xl font-extrabold">{group.title}</h3>
                <ol className="mt-6 space-y-5">
                  {group.items.map(({ icon: Icon, text }, i) => (
                    <li key={text} className="flex items-center gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-beige text-ink">
                        <Icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <span className="font-medium">
                        <span className="text-muted">{i + 1}. </span>
                        {text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-ink p-8 text-white sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t("ctaTitle")}</h2>
              <p className="mt-2 max-w-xl text-white/70">{t("ctaText")}</p>
            </div>
            <Link
              href="/sell"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-beige px-6 py-3 font-bold text-ink transition hover:bg-white"
            >
              <HandCoins className="size-5" />
              {t("ctaButton")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
