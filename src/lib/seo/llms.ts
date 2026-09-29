/**
 * /llms.txt and /llms-full.txt (llmstxt.org): H1, blockquote summary, factual prose
 * (bold-labelled paragraphs), then H2 sections that contain only markdown link lists,
 * with "## Optional" last. Facts come from live settings (EN and AR) so assistants quote
 * current fees and services. UAE only.
 */
import { shopEnabled, type BlogCard, type Category, type Product, type PublicSettings } from "@/lib/api";
import { hasFreeDelivery, serviceFee } from "@/lib/fees";
import { metaPrice } from "@/lib/format";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";
import { cityName } from "@/lib/ui";
import { LAST_UPDATED, PAGES } from "@/content/pages";
import { AI_FILES, SITE_NAME, SITE_NAME_AR, SITE_URL, UAE_CITIES, routes } from "./config";
import { siteUrl } from "./metadata";

const CONDITION_LABEL: Record<Product["condition"], string> = {
  new: "New",
  premium: "Premium",
  semi_new: "Semi-new",
  good: "Good condition",
  fair: "Fair",
};

const en = (path: string) => siteUrl("en", path);
const ar = (path: string) => siteUrl("ar", path);
const aed = (n: number) => `AED ${n.toLocaleString("en")}`;
const dirham = (n: number) => `${n.toLocaleString("en")} درهم`;
const link = (name: string, url: string, note?: string) => `- [${name}](${url})${note ? `: ${note}` : ""}`;
const noDot = (s: string) => s.replace(/\.$/, "");

type Settings = PublicSettings | null;

/** How a bought item changes hands, from the delivery/pickup switches. */
function handover(s: Settings) {
  const d = s?.delivery;
  const delivery = !!d?.enabled;
  const pickup = !!d?.pickupEnabled;
  return {
    en: [delivery && "delivers", pickup && "the buyer collects from the warehouse at no charge"].filter(Boolean).join(" or "),
    enPay: [delivery && "on delivery", pickup && "on collection"].filter(Boolean).join(" or ") || "on delivery",
    ar: [delivery && "نوصلها", pickup && "تستلمها من المستودع مجاناً"].filter(Boolean).join("، أو "),
    arPay: [delivery && "التوصيل", pickup && "الاستلام من المستودع"].filter(Boolean).join(" أو ") || "الاستلام",
  };
}

/** "Installation AED 150 (Appliances & Electronics)": services only apply to some categories. */
function servicesLine(s: Settings, categories: Category[], money: (n: number) => string, free: string): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return (s?.services ?? [])
    .map((x) => {
      const cats = x.categories.map((id) => names.get(id)).filter(Boolean);
      return `${x.name} ${x.fee === 0 ? free : money(x.fee)}${cats.length ? ` (${cats.join(", ")})` : ""}`;
    })
    .join(", ");
}

function facts(s: Settings, updated: string, categories: Category[]): string {
  const d = s?.delivery;
  const store = shopEnabled(s);
  const services = serviceList(s);
  const hand = handover(s);
  const listingDays = s?.listing?.days ?? 30;
  const commission = s?.listing?.commissionPercent ?? 10;
  const out: string[] = [];

  const summary = store
    ? `${SITE_NAME} buys used furniture, appliances (fridges, washing machines, ACs) and electronics from people anywhere in the United Arab Emirates for cash, with free pickup; refurbishes and resells them online; sells items listed by their owners${services ? `; and offers ${services}` : ""}. Cash ${hand.enPay}.`
    : `${SITE_NAME} buys used furniture, appliances and electronics from people anywhere in the United Arab Emirates for cash, with free pickup${services ? `, and offers ${services}` : ""}.`;

  out.push(`# ${SITE_NAME} (${SITE_NAME_AR})

> ${summary} UAE only: ${UAE_CITIES.join(", ")}. Arabic and English.

Official website: ${SITE_URL}
Last updated: ${updated.slice(0, 10)}`);

  if (!store) {
    out.push(
      `**The online store is closed at the moment.** ${SITE_NAME} is still buying used items${services ? ` and offering ${services}` : ""}. There are no customer accounts; people sell with a name and phone number. ${SITE_NAME} does not accept donations.`,
    );
  } else {
    out.push(`${SITE_NAME} mainly buys, refurbishes and resells items itself; those are inspected by its team, and some carry a warranty. It also sells items on behalf of their owners ("owner listings"), tagged "Unchecked by our experts": ${SITE_NAME} handles the order${d?.enabled ? " and delivery" : ""} but does not inspect or guarantee them, and they have no warranty. Owners' contact details are never shown. There are no customer accounts; people order or sell with a name and phone number. ${SITE_NAME} does not accept donations.

**Buying:** choose an item and tap "Buy", then enter name, phone, emirate and address (one item per order, no cart). ${SITE_NAME} confirms by phone or WhatsApp${hand.en ? `, then ${hand.en}` : ""}. Payment is cash ${hand.enPay}. Items marked "Negotiable" have a WhatsApp "Negotiate" button. Condition tags: New, Premium, Semi-new, Good condition, Fair.`);
  }

  out.push(
    `**Selling:** send 1–10 photos, a category, a description and an asking price through the Sell form, then choose "Sell it to LoopHome" (a cash offer on WhatsApp, usually within 24 hours; free pickup from home anywhere in the UAE; paid in cash on pickup) or "List it on LoopHome" (the owner sets the price; after approval the item is shown for ${listingDays} days and the owner receives the price minus a ${commission}% commission when it sells).`,
  );

  if (store) {
    out.push(
      `**Returns and warranty:** inspect the item on ${d?.enabled ? "delivery" : "collection"}; it can be refused ${d?.enabled ? "at the door" : "on the spot"} if it is damaged or not as described. If it doesn't match its description, report it on WhatsApp within ${REPORT_WINDOW_HOURS} hours of ${d?.enabled ? "delivery" : "collection"}: ${SITE_NAME} collects it free and refunds the full amount, including delivery and service fees (cash on collection, or bank transfer within 7 working days). No change-of-mind returns. Some items ${SITE_NAME} sells itself include a warranty, shown on the item page; owner listings have no warranty.`,
    );
  }

  if (d?.enabled && store) {
    const cities = d.cityFees.map((c) => `${c.city} ${aed(c.fee)}`).join(", ");
    const extras = servicesLine(s, categories, aed, "free");
    const fees = allFree(d)
      ? "delivery is free across the UAE."
      : `delivery across the UAE costs ${cities ? `${cities}, other emirates ` : ""}${aed(d.defaultFee)}. Free delivery on items marked "Free delivery"${d.freeOver != null ? ` and on items priced ${aed(d.freeOver)} or more` : ""}.`;
    out.push(
      `**Delivery and fees:** ${fees}${extras ? ` Optional services at checkout: ${extras}.` : ""} The total (item + delivery + services) is shown before the order is sent.`,
    );
  }

  const m = s?.moving;
  if (m?.enabled) {
    const from = (["home", "office"] as const)
      .filter((k) => m.startingFrom[k] != null)
      .map((k) => `${k} moves from ${aed(m.startingFrom[k]!)}`);
    out.push(
      `**Moving:** ${SITE_NAME} moves homes and offices within and between all emirates. Every move starts with a free site visit; ${SITE_NAME} inspects first, then sends a quote on WhatsApp${from.length ? ` (${from.join(", ")})` : ""}. Extra services: ${m.services.map((x) => x.label).join(", ")}.`,
    );
  }

  const tc = s?.technician;
  if (tc?.enabled && tc.types.length) {
    out.push(
      `**Technician visits:** ${tc.types.map((x) => `${x.name}: ${noDot(x.description).toLowerCase()}`).join("; ")}. ${tc.visitFee != null ? `Visit fee from ${aed(tc.visitFee)}.` : "The price is confirmed by phone before the visit."} Requests can be marked urgent.`,
    );
  }

  const st = s?.store;
  const bits = [
    st?.whatsapp && `WhatsApp ${st.whatsapp}`,
    st?.phone && st.phone !== st.whatsapp && `phone ${st.phone}`,
    st?.email,
    st?.hours && `hours ${st.hours}`,
    st?.address && `${st.address}, United Arab Emirates`,
  ].filter(Boolean);
  out.push(
    bits.length
      ? `**Contact:** ${bits.join("; ")}.`
      : `**Contact:** through the forms on ${en(routes.sell)}${s?.moving?.enabled ? `, ${en(routes.moving)}` : ""}${s?.technician?.enabled ? `, ${en(routes.technician)}` : ""}; ${SITE_NAME} replies by phone or WhatsApp.`,
  );

  return `${out.join("\n\n")}\n`;
}

/** No per-city fee and a zero default: every delivery is free. */
const allFree = (d: NonNullable<PublicSettings["delivery"]>) => d.defaultFee === 0 && d.cityFees.every((c) => c.fee === 0);

/** Contact channels are only promised when the admin has filled them in. */
const hasContact = (s: Settings) => !!(s?.store?.whatsapp || s?.store?.phone || s?.store?.email);

/** "home and office moving and technician visits", or just the ones switched on. */
function serviceList(s: Settings): string {
  const on = [s?.moving?.enabled && "home and office moving", s?.technician?.enabled && "technician visits"].filter(Boolean);
  return on.join(" and ");
}

function pages(s: Settings): string {
  return `
## Key pages

${[
    link("Home", en("")),
    shopEnabled(s) && link("Store", en(routes.store), "all items in stock; refurbished stock is added as it is ready"),
    link("Sell to LoopHome", en(routes.sell), "cash offer or list your item"),
    link("Sell all your furniture before moving", en(routes.sellMovingOut), "for people leaving the UAE or moving house"),
    link("Sell appliances", en(routes.sellAppliances), "ACs, fridges, washing machines"),
    s?.moving?.enabled && link("Moving", en(routes.moving), "request a free site visit"),
    s?.technician?.enabled && link("Technicians", en(routes.technician), "plumbing, electrical, AC, curtains, assembly, handyman"),
    link("Condition grades", en(routes.conditionGrades), "what New, Premium, Semi-new, Good and Fair mean"),
    link("Contact", en(routes.contact), hasContact(s) ? "WhatsApp, phone, email, hours" : undefined),
    link("About", en(routes.about)),
    link("Terms & conditions", en(routes.terms), "delivery, fees, warranty, returns, owner listings"),
  ]
    .filter(Boolean)
    .join("\n")}
`;
}

function categoriesSection(all: Category[]): string {
  // Empty categories are noindex, so they aren't pointed to either.
  const categories = all.filter((c) => (c.productCount ?? 1) > 0);
  if (!categories.length) return "";
  return `
## Categories

${categories.map((c) => link(c.name, en(routes.category(c.slug)), `Arabic: ${ar(routes.category(c.slug))}`)).join("\n")}
`;
}

/** Arabic facts (from the Arabic settings), built from the same switches as the English ones. */
function arabicFacts(s: Settings, categories: Category[]): string {
  const d = s?.delivery;
  const store = shopEnabled(s);
  const hand = handover(s);
  const m = s?.moving;
  const tc = s?.technician;
  const services = [m?.enabled && "نقل المنازل والمكاتب", tc?.enabled && "زيارات الفنيين"].filter(Boolean).join(" و");
  const lines: string[] = [
    store
      ? `**بالعربية:** لوب هوم يشتري الأغراض المنزلية المستعملة في الإمارات ويجدّدها ويبيعها أونلاين، ويعرض قطعاً يبيعها أصحابها${services ? `، ويقدّم خدمات ${services}` : ""}. الدفع نقداً عند ${hand.arPay}، ولا نقبل التبرعات.`
      : `**بالعربية:** لوب هوم يشتري الأغراض المنزلية المستعملة في الإمارات${services ? ` ويقدّم خدمات ${services}` : ""}. المتجر الإلكتروني مغلق حالياً، وما زلنا نشتري الأغراض المستعملة. لا نقبل التبرعات.`,
  ];
  if (store) {
    lines.push(`الشراء: اختر قطعة واضغط "شراء"، ونؤكد معك بالهاتف أو واتساب${hand.ar ? ` ثم ${hand.ar}` : ""}.`);
  }
  lines.push(
    `البيع: أرسل من 1 إلى 10 صور مع الفئة والوصف والسعر، واختر "بِعها لـ لوب هوم" لتحصل على عرض نقدي عبر واتساب واستلام مجاني من منزلك ودفع نقدي، أو "اعرضها على لوب هوم" وتحدد سعرك بنفسك، ونعرضها ${s?.listing?.days ?? 30} يوماً وتحصل على السعر بعد خصم عمولة ${s?.listing?.commissionPercent ?? 10}% عند البيع.`,
  );
  if (store && d?.enabled) {
    const fees = [...d.cityFees.map((c) => `${cityName(c.city, "ar")} ${dirham(c.fee)}`), `${d.cityFees.length ? "باقي الإمارات" : "جميع الإمارات"} ${dirham(d.defaultFee)}`].join("، ");
    const extras = servicesLine(s, categories, dirham, "مجاناً");
    lines.push(
      allFree(d)
        ? `التوصيل: مجاني إلى جميع الإمارات.${extras ? ` خدمات إضافية عند الطلب: ${extras}.` : ""}`
        : `التوصيل: ${fees}. التوصيل مجاني للقطع الموسومة "توصيل مجاني"${d.freeOver != null ? ` وللقطع التي سعرها ${dirham(d.freeOver)} أو أكثر` : ""}.${extras ? ` خدمات إضافية عند الطلب: ${extras}.` : ""}`,
    );
  }
  if (store) {
    lines.push(
      `الإرجاع والضمان: افحص القطعة عند الاستلام، ويمكنك رفضها فوراً إذا كانت متضررة أو لا تطابق الوصف. وإذا لم تطابق وصفها أخبرنا عبر واتساب خلال ${REPORT_WINDOW_HOURS} ساعة من الاستلام فنستلمها مجاناً ونعيد المبلغ كاملاً بما فيه رسوم التوصيل والخدمات (نقداً عند استلامها منك، أو بتحويل بنكي خلال 7 أيام عمل). لا يُقبل الإرجاع لتغيير الرأي. بعض القطع التي نبيعها بأنفسنا عليها ضمان تظهر مدته في صفحتها، وإعلانات المالكين بلا ضمان.`,
    );
  }
  if (m?.enabled) {
    const from = [m.startingFrom.home != null && `نقل المنازل من ${dirham(m.startingFrom.home)}`, m.startingFrom.office != null && `نقل المكاتب من ${dirham(m.startingFrom.office)}`].filter(Boolean);
    lines.push(
      `النقل: ننقل المنازل والمكاتب داخل الإمارات وبينها، وتبدأ كل عملية نقل بزيارة معاينة مجانية ثم نرسل السعر عبر واتساب${from.length ? ` (${from.join("، ")})` : ""}. خدمات إضافية: ${m.services.map((x) => x.label).join("، ")}.`,
    );
  }
  if (tc?.enabled && tc.types.length) {
    lines.push(
      `الفنيون: ${tc.types.map((x) => x.name).join("، ")}. ${tc.visitFee != null ? `رسوم الزيارة من ${dirham(tc.visitFee)}.` : "نؤكد السعر معك هاتفياً قبل الزيارة."}`,
    );
  }
  const st = s?.store;
  const contact = [st?.whatsapp && `واتساب ${st.whatsapp}`, st?.phone && st.phone !== st.whatsapp && `هاتف ${st.phone}`, st?.email, st?.hours && `ساعات العمل ${st.hours}`, st?.address && `العنوان: ${st.address}، الإمارات العربية المتحدة`].filter(Boolean);
  if (contact.length) lines.push(`تواصل معنا: ${contact.join("، ")}.`);
  return `\n${lines.join("\n\n")}\n`;
}

/** Links to the /ar pages: an H2 section holds only a link list (llmstxt.org). */
function arabicLinks(s: Settings): string {
  const links = [
    link("الرئيسية", ar("")),
    shopEnabled(s) && link("المتجر", ar(routes.store)),
    link("بِع لـ لوب هوم", ar(routes.sell)),
    link("بِع أجهزتك", ar(routes.sellAppliances)),
    link("مسافر؟ نشتري أثاثك كاملاً", ar(routes.sellMovingOut)),
    s?.moving?.enabled && link("النقل – زيارة معاينة مجانية", ar(routes.moving)),
    s?.technician?.enabled && link("اطلب فنياً", ar(routes.technician)),
    link("دليل حالة القطع", ar(routes.conditionGrades)),
    link("الأدلة والمقالات", ar(routes.blog)),
    link("تواصل معنا", ar(routes.contact)),
    link("من نحن", ar(routes.about)),
    link("الشروط والأحكام", ar(routes.terms)),
  ].filter(Boolean);

  return `
## بالعربية

${links.join("\n")}
`;
}

function productFacts(p: Product, s: Settings): string[] {
  // Services free for everyone are stated once above, not on every item.
  const free = (s?.services ?? []).filter((x) => x.fee > 0 && serviceFee(x, p) === 0).map((x) => x.name);
  return [
    p.inspected === false ? "owner listing, not inspected by LoopHome" : null,
    CONDITION_LABEL[p.condition],
    p.category?.name,
    // originalPrice is LoopHome's list price before a discount, not the price when new.
    p.originalPrice ? `list price ${metaPrice(p.originalPrice, p.currency, "en")}${p.savingPercent ? `, ${p.savingPercent}% off` : ""}` : null,
    p.warrantyDays ? `${p.warrantyDays}-day warranty` : null,
    hasFreeDelivery(p, s) ? "free delivery" : null,
    free.length ? `free ${free.join(", ")}` : null,
    p.negotiable ? "negotiable" : null,
  ].filter(Boolean) as string[];
}

const productLine = (p: Product, s: Settings) =>
  link(p.title, en(routes.product(p.slug)), `${metaPrice(p.price, p.currency, "en")} (${productFacts(p, s).join(", ")})`);

const optional = (full: boolean) => `
## Optional

${[
    !full && link("Full catalogue for AI", `${SITE_URL}${AI_FILES.llmsFull}`, "every item in stock with descriptions"),
    link("Privacy policy", en(routes.privacy)),
    link("Sitemap", `${SITE_URL}/sitemap.xml`),
  ]
    .filter(Boolean)
    .join("\n")}
`;

/** Freshness from real data: the newest product, post or policy change (not "today" on every request). */
export const lastUpdated = (products: Product[], posts: BlogCard[] = []) =>
  [
    ...products.map((p) => p.updatedAt ?? p.publishedAt ?? ""),
    ...posts.map((p) => p.updatedAt ?? p.publishedAt),
    new Date(LAST_UPDATED).toISOString(),
  ]
    .sort()
    .at(-1)!;

type Input = {
  categories: Category[];
  /** Arabic category names, for the Arabic services line. */
  categoriesAr?: Category[];
  products: Product[];
  settings: Settings;
  settingsAr: Settings;
  posts?: BlogCard[];
};

function guides(posts: BlogCard[] = []): string {
  if (!posts.length) return "";
  return `
## Guides

${[link("All guides", en(routes.blog), "buying, selling, moving and home services in the UAE"), ...posts.map((p) => link(p.title, en(routes.post(p.slug)), p.excerpt))].join("\n")}
`;
}

/** Short index for AI assistants: /llms.txt */
export function formatLlms({ categories, categoriesAr = [], products, settings, settingsAr, posts }: Input): string {
  const store = shopEnabled(settings);
  const latest = store ? products.slice(0, 30) : [];
  return [
    facts(settings, lastUpdated(products, posts), categories),
    arabicFacts(settingsAr, categoriesAr),
    pages(settings),
    guides(posts),
    store ? categoriesSection(categories) : "",
    latest.length ? `\n## Latest items in stock\n\n${latest.map((p) => productLine(p, settings)).join("\n")}\n` : "",
    arabicLinks(settingsAr),
    optional(false),
  ].join("");
}

/** Long form for retrieval: /llms-full.txt, every in-stock item with its description. */
export function formatLlmsFull({ categories, categoriesAr = [], products, settings, settingsAr, posts }: Input): string {
  const store = shopEnabled(settings);
  const byCategory = new Map<string, Product[]>();
  for (const p of store ? products : []) {
    const key = p.category?.name ?? "Other";
    byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
  }
  const catalog = [...byCategory.entries()].map(([name, list]) =>
    [
      `## ${name} (${list.length})`,
      "",
      ...list.map((p) =>
        [productLine(p, settings), p.description ? `  ${p.description.replace(/\s+/g, " ").trim()}` : ""].filter(Boolean).join("\n"),
      ),
    ].join("\n"),
  );

  return [
    facts(settings, lastUpdated(products, posts), categories),
    arabicFacts(settingsAr, categoriesAr),
    // Prose stays above the first H2 (llmstxt.org: H2 sections hold only link lists).
    policies(),
    pages(settings),
    guides(posts),
    store ? categoriesSection(categories) : "",
    catalog.length ? `\n${catalog.join("\n\n")}\n` : "",
    arabicLinks(settingsAr),
    optional(true),
  ].join("");
}

/** The full text of the policy and guide pages, so answers can quote them (llms-full only). */
function policies(): string {
  const page = (url: string, p: { title: string; intro: string; sections: { heading: string; body: string[] }[] }) =>
    [`**${p.title}** (${url}): ${p.intro}`, ...p.sections.map((x) => `- ${x.heading}: ${x.body.join(" ")}`)].join("\n");
  return `\n${[
    page(en(routes.conditionGrades), PAGES.conditionGrades.en),
    page(en(routes.sellAppliances), PAGES.sellAppliances.en),
    page(en(routes.sellMovingOut), PAGES.movingOut.en),
    page(en(routes.terms), PAGES.terms.en),
  ].join("\n\n")}\n`;
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  // AI assistants read these; search results should show the real pages instead.
  "X-Robots-Tag": "noindex",
  // Short: a sold item must not stay "in stock" here for long.
  "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  "Access-Control-Allow-Origin": "*",
};
