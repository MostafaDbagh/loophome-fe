import type { Locale } from "@/i18n/routing";
import { shopEnabled, type Product, type PublicSettings } from "@/lib/api";
import { hasFreeDelivery } from "@/lib/fees";
import { COUNTRY, DEFAULT_LOCALE, DUBAI_AREAS, SITE_NAME, SITE_NAME_AR, SITE_URL, UAE_CITIES, routes } from "./config";
import { defaultOgImage, siteUrl } from "./metadata";

type Thing = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
/** One policy and one WebSite for the whole domain: Google reads site names per domain, and the
 * same @id must never carry different values on different pages. */
const RETURN_POLICY_ID = `${SITE_URL}/#return-policy`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const UAE: Thing = {
  "@type": "Country",
  name: COUNTRY.name,
  alternateName: COUNTRY.nameAr,
  identifier: COUNTRY.code,
  sameAs: "https://www.wikidata.org/wiki/Q878",
};
const DUBAI: Thing = { "@type": "City", name: "Dubai", alternateName: "دبي", sameAs: "https://www.wikidata.org/wiki/Q612", containedInPlace: UAE };

/** "JVC (Jumeirah Village Circle)" → name "Jumeirah Village Circle", alternateName ["JVC", the other language's name]. */
function areaPlace(area: (typeof DUBAI_AREAS)[number], locale: Locale): Thing {
  const label = area[locale];
  const m = label.match(/^(.+?)\s*\((.+)\)$/);
  const [name, short] = m ? [m[1], m[2]].sort((a, b) => b.length - a.length) : [label];
  const other = area[locale === "ar" ? "en" : "ar"];
  return {
    "@type": "Place",
    name,
    alternateName: [short, other].filter(Boolean),
    containedInPlace: { "@type": "City", name: "Dubai" },
  };
}

/** Dubai first, then its focus communities, then the rest of the UAE. Only where the areas are shown. */
const dubaiFirst = (locale: Locale): Thing[] => [DUBAI, ...DUBAI_AREAS.map((a) => areaPlace(a, locale)), UAE];

function withoutContext(node: Thing): Thing {
  const copy = { ...node };
  delete copy["@context"];
  return copy;
}

/** Renders JSON-LD safely (escapes "<" so product text can't close the script tag). */
export function JsonLd({ data }: { data: Thing | Thing[] }) {
  const graph = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data.map(withoutContext) }
    : data;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Terms (/terms#returns): no change-of-mind returns; items that don't match their description
 * can be reported within 48 hours. schema.org can't express "defect-only returns", so the honest
 * encoding is "not permitted" with a link to the exact terms.
 */
function returnPolicy(): Thing {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": RETURN_POLICY_ID,
    applicableCountry: COUNTRY.code,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${siteUrl(DEFAULT_LOCALE, routes.terms)}#returns`,
  };
}

const WEEK = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * "Daily 9:00–21:00" or "Sat–Thu 9:00–21:00" → `openingHours` ("Mo-Su 09:00-21:00") and the
 * OpeningHoursSpecification Google documents; undefined if the admin's text doesn't parse.
 */
function openingHours(text?: string): { openingHours: string; openingHoursSpecification: Thing } | undefined {
  const m = text?.match(/^\s*(?:(daily|every day)|([A-Za-z]{3})\s*[–-]\s*([A-Za-z]{3}))\s+(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})\s*$/i);
  if (!m) return undefined;
  const dayOfWeek: string[] = [];
  if (m[1]) dayOfWeek.push(...WEEK);
  else {
    const [from, to] = [m[2], m[3]].map((d) => WEEK.findIndex((w) => w.slice(0, 3).toLowerCase() === d.toLowerCase()));
    if (from < 0 || to < 0) return undefined;
    for (let i = from; ; i = (i + 1) % 7) {
      dayOfWeek.push(WEEK[i]);
      if (i === to) break;
    }
  }
  const pad = (h: string) => h.padStart(2, "0");
  const [opens, closes] = [`${pad(m[4])}:${m[5]}`, `${pad(m[6])}:${m[7]}`];
  const days = dayOfWeek.length === 7 ? "Mo-Su" : dayOfWeek.map((d) => d.slice(0, 2)).join(",");
  return {
    openingHours: `${days} ${opens}-${closes}`,
    openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes },
  };
}

/** The store itself: an online shop that serves the UAE only. */
export function organizationSchema(locale: Locale, settings?: PublicSettings | null): Thing {
  const store = settings?.store;
  const services = !!(settings?.moving?.enabled || settings?.technician?.enabled);
  // "Warehouse 7, Al Quoz Industrial 3, Dubai" → "Dubai" when the last part is an emirate.
  const lastPart = store?.address?.split(",").at(-1)?.trim();
  const locality = lastPart && UAE_CITIES.includes(lastPart) ? lastPart : undefined;
  const hours = openingHours(store?.hours);
  const contactPoint =
    store?.phone || store?.whatsapp || store?.email
      ? {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: store.phone || store.whatsapp || undefined,
          email: store.email || undefined,
          areaServed: COUNTRY.code,
          availableLanguage: ["Arabic", "English"],
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    // A home-services business too when moving or technician visits are offered.
    "@type": services
      ? ["OnlineStore", "HomeAndConstructionBusiness", ...(settings?.moving?.enabled ? ["MovingCompany"] : [])]
      : "OnlineStore",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_NAME_AR,
    url: SITE_URL,
    logo: `${SITE_URL}/app-icons/icon-512x512.png`,
    image: defaultOgImage("en"),
    // Same text on every page: this @id is one entity wherever it appears.
    description: `${SITE_NAME} (${SITE_NAME_AR}) is a Dubai-based company that buys used furniture, appliances and electronics for cash, refurbishes and resells them in Dubai and across the UAE, and sells items listed by their owners${services ? "; it also offers home and office moving and technician visits" : ""}.${shopEnabled(settings) ? " Buyers pay cash on delivery." : ""}`,
    // Dubai and the UAE only: the focus communities are listed on the pages that show them.
    areaServed: [DUBAI, UAE],
    address: store?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: store.address,
          ...(locality && { addressLocality: locality, addressRegion: locality }),
          addressCountry: COUNTRY.code,
        }
      : { "@type": "PostalAddress", addressCountry: COUNTRY.code },
    contactPoint,
    telephone: store?.phone || store?.whatsapp || undefined,
    email: store?.email || undefined,
    knowsLanguage: ["ar", "en"],
    // LocalBusiness-only properties; OnlineStore alone doesn't have them.
    ...(services && { currenciesAccepted: "AED", paymentAccepted: "Cash", ...hours }),
    // No organization-wide return policy: Google would apply it to owner listings too.
  };
}

/** WebSite (no SearchAction: Google retired the sitelinks search box). One node for both languages. */
export function websiteSchema(): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: SITE_NAME_AR,
    url: siteUrl(DEFAULT_LOCALE),
    inLanguage: ["en-AE", "ar-AE"],
    publisher: { "@id": ORG_ID },
  };
}

/** items: [{ name, path }] from home to the current page, locale-less paths. */
export function breadcrumbSchema(locale: Locale, items: { name: string; path: string }[]): Thing {
  const last = items.at(-1);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(last && { "@id": `${siteUrl(locale, last.path)}#breadcrumb` }),
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(locale, item.path),
    })),
  };
}

/**
 * Google's "refurbished" means professionally restored AND sold with a warranty; "new" means
 * unused. Anything else is "used".
 */
export function itemCondition(product: Product): "new" | "refurbished" | "used" {
  if (product.condition === "new") return "new";
  // Owner listings are never "refurbished": LoopHome hasn't inspected them.
  if (product.inspected !== false && product.warrantyDays > 0 && product.condition !== "fair") return "refurbished";
  return "used";
}

const CONDITION_URL = {
  new: "https://schema.org/NewCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
  used: "https://schema.org/UsedCondition",
};


const AVAILABILITY: Record<Product["status"], string> = {
  active: "https://schema.org/InStock",
  // Google doesn't accept Reserved; a reserved item can't be ordered.
  reserved: "https://schema.org/OutOfStock",
  sold: "https://schema.org/SoldOut",
};

/** Highest delivery fee, so the listed shipping rate never understates what a buyer pays. */
function shippingRate(product: Product, settings: PublicSettings | null | undefined): number | null {
  if (!settings?.delivery.enabled) return null;
  if (hasFreeDelivery(product, settings)) return 0;
  const d = settings?.delivery;
  if (!d || d.currency !== product.currency) return null;
  return Math.max(d.defaultFee, ...d.cityFees.map((c) => c.fee));
}

/** Product + Offer for a product page. Must match what the page visibly shows. */
export function productSchema(locale: Locale, product: Product, settings?: PublicSettings | null): Thing {
  const url = siteUrl(locale, routes.product(product.slug));
  const rate = shippingRate(product, settings);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    description: product.description,
    image: product.photos.map((p) => p.url),
    sku: product.ref || product.id,
    productID: product.ref || undefined,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    category: product.category?.name,
    itemCondition: CONDITION_URL[itemCondition(product)],
    offers: {
      "@type": "Offer",
      url,
      price: product.price,
      priceCurrency: product.currency,
      // The struck-through list price shown next to a discounted price. `priceWhenNew` is never
      // marked up: it's an estimate for a new item, not a price LoopHome charged before.
      ...(product.originalPrice &&
        product.originalPrice > product.price && {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: product.originalPrice,
            priceCurrency: product.currency,
          },
        }),
      availability: AVAILABILITY[product.status],
      itemCondition: CONDITION_URL[itemCondition(product)],
      seller: { "@id": ORG_ID },
      eligibleRegion: UAE,
      // Owner listings: return rules not confirmed yet, so no policy is claimed for them.
      ...(product.inspected !== false && { hasMerchantReturnPolicy: returnPolicy() }),
      ...(rate != null && {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: COUNTRY.code },
          shippingRate: { "@type": "MonetaryAmount", value: rate, currency: product.currency },
        },
      }),
      ...(product.inspected !== false && product.warrantyDays > 0 && {
        warranty: {
          "@type": "WarrantyPromise",
          durationOfWarranty: { "@type": "QuantitativeValue", value: product.warrantyDays, unitCode: "DAY" },
        },
      }),
    },
  };
}

/** Home page node, with the "new arrivals" list as its main entity. */
export function homePageSchema(locale: Locale, name: string, description: string, hasItems: boolean): Thing {
  const url = siteUrl(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    ...(hasItems && { mainEntity: { "@id": `${url}#items` } }),
  };
}

/** The product page itself, linking breadcrumb and product. */
export function itemPageSchema(locale: Locale, product: Product): Thing {
  const url = siteUrl(locale, routes.product(product.slug));
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "@id": `${url}#webpage`,
    url,
    name: product.title,
    inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": `${url}#product` },
  };
}

/** ItemList for store/category listings (the products visible on that page). */
export function itemListSchema(locale: Locale, products: Product[], name: string, id?: string): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(id && { "@id": id }),
    name,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: siteUrl(locale, routes.product(p.slug)),
      name: p.title,
    })),
  };
}

/** CollectionPage for the store or a category page; its main entity is the product list. */
export function collectionSchema(
  locale: Locale,
  page: { name: string; description: string; path: string },
  products: Product[],
): Thing[] {
  const url = siteUrl(locale, page.path);
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      name: page.name,
      description: page.description,
      url,
      inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      spatialCoverage: UAE,
      ...(products.length && { mainEntity: { "@id": `${url}#items` } }),
    },
    ...(products.length ? [itemListSchema(locale, products, page.name, `${url}#items`)] : []),
  ];
}

/** Buying used items from people (the Sell pages): free pickup, cash at pickup. */
export function sellServiceSchema(locale: Locale, name: string, description: string, path: string = routes.sell): Thing {
  const url = siteUrl(locale, path);
  const ar = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType: ar ? "شراء الأثاث والأجهزة المستعملة" : "Buying used furniture and appliances",
    url,
    provider: { "@id": ORG_ID },
    areaServed: dubaiFirst(locale),
    offers: { "@type": "Offer", name: ar ? "استلام مجاني" : "Free pickup", price: 0, priceCurrency: "AED", areaServed: UAE },
  };
}

/** AboutPage / ContactPage / WebPage (legal) tied to the organization and site. */
export function webPageSchema(
  locale: Locale,
  type: "AboutPage" | "ContactPage" | "WebPage",
  page: { name: string; description: string; path: string; dateModified?: string; mainEntity?: string },
): Thing {
  const url = siteUrl(locale, page.path);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    name: page.name,
    description: page.description,
    url,
    inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    about: { "@id": ORG_ID },
    ...(page.mainEntity && { mainEntity: { "@id": page.mainEntity } }),
    ...(page.dateModified && { dateModified: page.dateModified }),
  };
}

/** FAQPage: only for questions shown on the same page. */
export function faqSchema(items: { q: string; a: string }[]): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** The moving service (quote after a free site visit), offered by LoopHome across the UAE. */
export function movingServiceSchema(
  locale: Locale,
  name: string,
  description: string,
  moving: { startingFrom: { home: number | null; office: number | null }; currency: string; services: { label: string; description: string }[] },
): Thing {
  const url = siteUrl(locale, routes.moving);
  const ar = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType: ar ? "نقل الأثاث" : "Moving and relocation",
    url,
    provider: { "@id": ORG_ID },
    areaServed: dubaiFirst(locale),
    offers: [
      { "@type": "Offer", name: ar ? "زيارة معاينة مجانية" : "Free site visit", price: 0, priceCurrency: moving.currency, areaServed: UAE },
      ...(["home", "office"] as const)
        .filter((k) => moving.startingFrom[k] != null)
        .map((k) => ({
          "@type": "Offer",
          name: ar ? (k === "home" ? "نقل منزل" : "نقل مكتب") : k === "home" ? "Home move" : "Office move",
          priceSpecification: { "@type": "PriceSpecification", minPrice: moving.startingFrom[k], priceCurrency: moving.currency },
          areaServed: UAE,
        })),
    ],
    ...(moving.services.length && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name,
        itemListElement: moving.services.map((x) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: x.label, description: x.description },
        })),
      },
    }),
  };
}

/** Technician visits (plumbing, electrical, AC…) offered by LoopHome across the UAE. */
export function technicianServiceSchema(
  locale: Locale,
  name: string,
  description: string,
  types: { key: string; name: string; description: string }[],
  visitFee: number | null = null,
  currency = "AED",
): Thing {
  const url = siteUrl(locale, routes.technician);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType: locale === "ar" ? "صيانة وإصلاح منزلي" : "Home maintenance and repair",
    url,
    provider: { "@id": ORG_ID },
    areaServed: dubaiFirst(locale),
    ...(visitFee != null && {
      offers: {
        "@type": "Offer",
        name: locale === "ar" ? "رسوم الزيارة" : "Visit fee",
        priceSpecification: { "@type": "PriceSpecification", minPrice: visitFee, priceCurrency: currency },
        areaServed: UAE,
      },
    }),
    ...(types.length && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name,
        itemListElement: types.map((ty) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: ty.name, description: ty.description, url: `${url}#${ty.key.replace(/_/g, "-")}` },
        })),
      },
    }),
  };
}

/**
 * Pickup truck with a driver for a block of hours, plus workers to load and unload; prices only as
 * the admin set them. `offerName` is the page's "Pickup with driver for 4 hours".
 */
export function pickupRentalServiceSchema(
  locale: Locale,
  name: string,
  description: string,
  offerName: string,
  rental: { basePrice: number | null; hours: number; workerPrice: number; currency: string },
): Thing {
  const url = siteUrl(locale, routes.pickupRental);
  const ar = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType: ar ? "تأجير بيك أب مع سائق" : "Pickup truck rental with driver",
    url,
    provider: { "@id": ORG_ID },
    // No area list on this page, so just Dubai and the UAE.
    areaServed: [DUBAI, UAE],
    offers: [
      ...(rental.basePrice != null
        ? [
            {
              "@type": "Offer",
              name: offerName,
              // The price covers this many hours (HUR = hour).
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: rental.basePrice,
                priceCurrency: rental.currency,
                referenceQuantity: { "@type": "QuantitativeValue", value: rental.hours, unitCode: "HUR" },
              },
              areaServed: UAE,
            },
          ]
        : []),
      {
        "@type": "Offer",
        name: ar ? "عامل للتحميل والتنزيل" : "Worker to load and unload",
        priceSpecification: { "@type": "UnitPriceSpecification", price: rental.workerPrice, priceCurrency: rental.currency, unitText: ar ? "لكل عامل" : "per worker" },
        areaServed: UAE,
      },
    ],
  };
}

/** Car recovery on a flatbed (سطحة): priced by distance, so at most a "starting from" price. */
export function carRecoveryServiceSchema(locale: Locale, name: string, description: string, startingFrom: number | null, currency = "AED"): Thing {
  const url = siteUrl(locale, routes.carRecovery);
  const ar = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType: ar ? "سطحة لنقل السيارات" : "Car recovery (flatbed towing)",
    url,
    provider: { "@id": ORG_ID },
    areaServed: [DUBAI, UAE],
    ...(startingFrom != null && {
      offers: {
        "@type": "Offer",
        name: ar ? "نقل سيارة بالسطحة" : "Flatbed car recovery",
        priceSpecification: { "@type": "PriceSpecification", minPrice: startingFrom, priceCurrency: currency },
        areaServed: UAE,
      },
    }),
  };
}

/** Blog article (Google Article / BlogPosting). */
export function blogPostingSchema(
  locale: Locale,
  post: { slug: string; title: string; excerpt: string; author: string; publishedAt: string; updatedAt: string; cover: { url: string } | null; tags: string[] },
): Thing {
  const url = siteUrl(locale, routes.post(post.slug));
  const area = DUBAI_AREAS.find((a) => a.guide === post.slug);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    // Team bylines are the organization (no @id: the layout's node has the store types); a named writer is a Person.
    author: isTeamByline(post.author)
      ? { "@type": "Organization", name: SITE_NAME, url: SITE_URL }
      : { "@type": "Person", name: post.author },
    publisher: { "@id": ORG_ID },
    image: post.cover?.url ?? defaultOgImage(locale),
    // Tags are English slugs, so they only describe the English article.
    ...(post.tags.length && locale === "en" && { keywords: post.tags.join(", ") }),
    isPartOf: { "@id": WEBSITE_ID },
    // Area guides are about one Dubai community.
    ...(area && { about: areaPlace(area, locale) }),
  };
}

export const isTeamByline = (author: string) => !author || /loophome|لوب ?هوم/i.test(author);
