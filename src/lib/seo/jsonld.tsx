import type { Locale } from "@/i18n/routing";
import type { Product, PublicSettings } from "@/lib/api";
import { hasFreeDelivery } from "@/lib/fees";
import { COUNTRY, SITE_NAME, SITE_NAME_AR, SITE_URL, UAE_CITIES, routes } from "./config";
import { siteUrl } from "./metadata";

type Thing = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const RETURN_POLICY_ID = `${SITE_URL}/#return-policy`;
/** One WebSite node per language (name and URL differ). */
const websiteId = (locale: Locale) => `${siteUrl(locale)}/#website`;

const UAE: Thing = { "@type": "Country", name: COUNTRY.name, identifier: COUNTRY.code };

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
function returnPolicy(locale: Locale): Thing {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": RETURN_POLICY_ID,
    applicableCountry: COUNTRY.code,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${siteUrl(locale, routes.terms)}#returns`,
  };
}

/** The store itself: an online shop that serves the UAE only. */
export function organizationSchema(locale: Locale, settings?: PublicSettings | null): Thing {
  const store = settings?.store;
  const contactPoint =
    store?.phone || store?.whatsapp || store?.email
      ? {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: store.phone || store.whatsapp,
          email: store.email,
          areaServed: COUNTRY.code,
          availableLanguage: ["Arabic", "English"],
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_NAME_AR,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    image: `${SITE_URL}/og`,
    description:
      locale === "ar"
        ? "هوم لوب يشتري الأغراض المنزلية المستعملة ويجدّدها ويعيد بيعها في الإمارات، مع الدفع عند الاستلام."
        : "HomeLoop buys used home items, refurbishes them and resells them across the UAE, with cash on delivery.",
    areaServed: [UAE, ...UAE_CITIES.map((name) => ({ "@type": "City", name }))],
    address: store?.address
      ? { "@type": "PostalAddress", streetAddress: store.address, addressCountry: COUNTRY.code }
      : { "@type": "PostalAddress", addressCountry: COUNTRY.code },
    contactPoint,
    telephone: store?.phone || store?.whatsapp || undefined,
    email: store?.email || undefined,
    knowsLanguage: ["ar", "en"],
    currenciesAccepted: "AED",
    paymentAccepted: "Cash",
    hasMerchantReturnPolicy: returnPolicy(locale),
  };
}

/** WebSite + sitelinks search box pointing at the store search. */
export function websiteSchema(locale: Locale): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(locale),
    name: locale === "ar" ? SITE_NAME_AR : SITE_NAME,
    alternateName: locale === "ar" ? SITE_NAME : SITE_NAME_AR,
    url: siteUrl(locale),
    inLanguage: locale === "ar" ? "ar-AE" : "en-AE",
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
function itemCondition(product: Product): string {
  if (product.condition === "new") return "https://schema.org/NewCondition";
  if (product.warrantyDays > 0 && product.condition !== "fair") return "https://schema.org/RefurbishedCondition";
  return "https://schema.org/UsedCondition";
}


const AVAILABILITY: Record<Product["status"], string> = {
  active: "https://schema.org/InStock",
  reserved: "https://schema.org/Reserved",
  sold: "https://schema.org/SoldOut",
};

/** Highest delivery fee, so the listed shipping rate never understates what a buyer pays. */
function shippingRate(product: Product, settings: PublicSettings | null | undefined): number | null {
  if (hasFreeDelivery(product, settings ?? null)) return 0;
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
    itemCondition: itemCondition(product),
    offers: {
      "@type": "Offer",
      url,
      price: product.price,
      priceCurrency: product.currency,
      availability: AVAILABILITY[product.status],
      itemCondition: itemCondition(product),
      seller: { "@id": ORG_ID },
      eligibleRegion: UAE,
      hasMerchantReturnPolicy: returnPolicy(locale),
      ...(rate != null && {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: COUNTRY.code },
          shippingRate: { "@type": "MonetaryAmount", value: rate, currency: product.currency },
        },
      }),
      ...(product.warrantyDays > 0 && {
        warranty: {
          "@type": "WarrantyPromise",
          durationOfWarranty: { "@type": "QuantitativeValue", value: product.warrantyDays, unitCode: "DAY" },
        },
      }),
    },
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
    isPartOf: { "@id": websiteId(locale) },
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
    numberOfItems: products.length,
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
      isPartOf: { "@id": websiteId(locale) },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      spatialCoverage: UAE,
      ...(products.length && { mainEntity: { "@id": `${url}#items` } }),
    },
    ...(products.length ? [itemListSchema(locale, products, page.name, `${url}#items`)] : []),
  ];
}

/** AboutPage / ContactPage / WebPage (legal) tied to the organization and site. */
export function webPageSchema(
  locale: Locale,
  type: "AboutPage" | "ContactPage" | "WebPage",
  page: { name: string; description: string; path: string; dateModified?: string },
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
    isPartOf: { "@id": websiteId(locale) },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    about: { "@id": ORG_ID },
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
