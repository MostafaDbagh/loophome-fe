import { ArrowRight, Camera, CarFront, HandCoins, MessageCircle, PackageCheck, ShoppingBag, Truck, Van, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import appliancesPhoto from "@/assets/hero/appliances.jpg";
import livingRoomPhoto from "@/assets/hero/living-room.jpg";
import movingPhoto from "@/assets/hero/moving.jpg";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { HeroAssistant } from "@/components/assistant/HeroAssistant";
import { SoonTag } from "@/components/ComingSoon";
import { DubaiAreas } from "@/components/DubaiAreas";
import { CategoryCards } from "@/components/CategoryCards";
import { ProductGrid } from "@/components/ProductGrid";
import { SampleNotice, SectionHeading } from "@/components/Section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { BlogCardView } from "@/components/blog/BlogBits";
import { getBlog, getCategories, getFeed, getSettings, servicesOn, shopEnabled, type PublicSettings } from "@/lib/api";
import { routes } from "@/lib/seo/config";
import { homePageSchema, itemListSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: "meta.home" }), getSettings(locale)]);
  return pageMetadata({ locale, path: routes.home, title: t("title"), description: homeDescription(t, settings), absoluteTitle: true });
}

/** Search description: buying only while the store is open, and only the services that are on. */
function homeDescription(t: (key: string) => string, settings: PublicSettings | null) {
  const on = servicesOn(settings);
  const services = on.moving && on.technician ? "servicesBoth" : on.moving ? "servicesMoving" : on.technician ? "servicesTechnician" : null;
  return [t(on.store ? "description" : "descriptionSell"), services && t(services)].filter(Boolean).join(" ");
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const ts = await getTranslations({ locale, namespace: "soon" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "meta.home" });
  const [feed, categories, settings, blog, messages] = await Promise.all([
    getFeed(locale),
    getCategories(locale),
    getSettings(locale),
    getBlog(locale, { limit: 3 }),
    getMessages({ locale }),
  ]);
  const tb = await getTranslations({ locale, namespace: "blog" });
  // The admin can switch the store off: the page then leads with selling and the services.
  const storeOn = shopEnabled(settings);
  // Fixed brand photos (Unsplash License): what LoopHome does, whatever is in stock today.
  const heroPhotos = [
    { src: livingRoomPhoto, alt: t("heroPhotoLiving") },
    { src: appliancesPhoto, alt: t("heroPhotoAppliances") },
    { src: movingPhoto, alt: t("heroPhotoMoving") },
  ];

  const steps = [
    storeOn && {
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
  ].filter((g) => !!g);

  return (
    <>
      {!feed.sample && (
        <JsonLd
          data={[
            homePageSchema(locale, tm("title"), homeDescription(tm, settings), feed.newArrivals.length > 0),
            ...(feed.newArrivals.length ? [itemListSchema(locale, feed.newArrivals, t("newArrivals"), `${siteUrl(locale)}#items`)] : []),
          ]}
        />
      )}
      {feed.sample && <SampleNotice text={tc("sample")} />}

      {/* Hero: headline beside a photo collage on beige */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <div className="grid overflow-hidden rounded-xl bg-beige lg:grid-cols-2">
          {/* min-w-0: the assistant's sideways-scrolling pills must not widen the column on phones. */}
          <div className="flex min-w-0 flex-col justify-center gap-6 p-5 sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t("badge")}</p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{t("title")}</h1>
            {/* The owner's line names moving and repair services: shown while one of them is on. */}
            <p className="max-w-md text-lg text-ink/70">{t(settings?.moving?.enabled || settings?.technician?.enabled ? "subtitle" : "subtitleSell")}</p>
            {/* "Just tell LoopHome what you need": search and services from one box. Only its own copy is sent to the browser. */}
            <NextIntlClientProvider messages={{ assistant: messages.assistant }}>
              <HeroAssistant />
            </NextIntlClientProvider>
          </div>
          <div className="grid min-h-72 grid-cols-2 grid-rows-2 gap-2 p-2 lg:min-h-[28rem]">
            {heroPhotos.map((p, i) => (
              <div key={p.src.src} className={`relative overflow-hidden rounded-lg ${i === 0 ? "row-span-2" : ""}`}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  placeholder="blur"
                  // The first (tall) tile is the LCP image; the others load eagerly but without preload.
                  preload={i === 0}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes={i === 0 ? "(min-width: 1024px) 600px, 50vw" : "(min-width: 1024px) 300px, 50vw"}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-14">
        {storeOn && (
          <>
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
          </>
        )}

        {storeOn && feed.bestDeals.length > 0 && (
          <section>
            <SectionHeading title={t("bestDeals")} href={routes.store} linkLabel={tc("viewAll")} />
            <ProductGrid products={feed.bestDeals.slice(0, 4)} />
          </section>
        )}

        <section>
          <SectionHeading title={t("howTitle")} />
          <div className={`grid gap-4 ${steps.length > 1 ? "md:grid-cols-2" : ""}`}>
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

        {/* Switched-off services stay listed with a "Soon" tag instead of disappearing. */}
        <section>
          <SectionHeading title={t("servicesTitle")} />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { on: !!settings?.moving?.enabled, href: routes.moving, icon: Truck, title: t("movingTitle"), text: t("movingText"), cta: t("movingCta") },
              {
                on: !!settings?.technician?.enabled,
                href: routes.technician,
                icon: Wrench,
                title: t("technicianTitle"),
                text: t("technicianText"),
                cta: t("technicianCta"),
              },
              {
                on: !!settings?.pickupRental?.enabled,
                href: routes.pickupRental,
                icon: Van,
                title: t("pickupRentalTitle"),
                text: t("pickupRentalText", { hours: settings?.pickupRental?.hours ?? 4 }),
                cta: t("pickupRentalCta"),
              },
              {
                on: !!settings?.carRecovery?.enabled,
                href: routes.carRecovery,
                icon: CarFront,
                title: t("carRecoveryTitle"),
                text: t("carRecoveryText"),
                cta: t("carRecoveryCta"),
              },
            ].map(({ on, href, icon: Icon, title, text, cta }) => (
              <div key={href} className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-surface p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-beige">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold">
                      {title}
                      {!on && <SoonTag className="ms-2 inline-block px-1.5 align-middle text-[10px] leading-4" />}
                    </h3>
                    <p className="mt-1 text-ink/70">{text}</p>
                  </div>
                </div>
                {on ? (
                  <Link href={href} className="btn-cta self-start">
                    {cta}
                  </Link>
                ) : (
                  <Link href={href} className="btn-ghost self-start">
                    {ts("title")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <DubaiAreas locale={locale} large />

        {blog.items.length > 0 && (
          <section>
            <SectionHeading title={tb("latest")} href={routes.blog} linkLabel={tb("viewAll")} />
            <div className="grid gap-6 sm:grid-cols-3">
              {blog.items.map((card) => (
                <BlogCardView key={card.slug} card={card} />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl bg-ink p-8 text-white sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t("ctaTitle")}</h2>
              <p className="mt-2 max-w-xl text-white/70">{t("ctaText")}</p>
              <Link href={routes.sellMovingOut} className="mt-3 inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2">
                {t("movingOutLink")}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
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
