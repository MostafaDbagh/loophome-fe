/**
 * /llms.txt and /llms-full.txt (llmstxt.org): H1, blockquote summary, factual prose
 * (bold-labelled paragraphs), then H2 sections that contain only markdown link lists,
 * with "## Optional" last. Facts come from live settings (EN and AR) so assistants quote
 * current fees and services. UAE only.
 */
import type { BlogCard, Category, Product, PublicSettings } from "@/lib/api";
import { hasFreeDelivery, serviceFee } from "@/lib/fees";
import { metaPrice } from "@/lib/format";
import { cityName } from "@/lib/ui";
import { AI_FILES, SITE_NAME, SITE_URL, UAE_CITIES, routes } from "./config";
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

function facts(s: Settings, updated: string): string {
  const d = s?.delivery;
  const listingDays = s?.listing?.days ?? 30;
  const commission = s?.listing?.commissionPercent ?? 10;
  const out: string[] = [];

  out.push(`# ${SITE_NAME} (هوم لوب)

> ${SITE_NAME} buys used home items from people in the United Arab Emirates, refurbishes and sells them online, sells items listed by their owners, and offers home and office moving and technician visits. Cash on delivery. UAE only: ${UAE_CITIES.join(", ")}. Arabic and English.

Last updated: ${updated}

${SITE_NAME} mainly buys, refurbishes and resells items itself; those are inspected by its team, and some carry a warranty. It also sells items on behalf of their owners ("owner listings"), tagged "Unchecked by our experts": ${SITE_NAME} handles the order and delivery but does not inspect or guarantee them, and they have no warranty. Owners' contact details are never shown. There are no customer accounts; people order or sell with a name and phone number. ${SITE_NAME} does not accept donations.

**Buying:** choose an item and tap "Buy", then enter name, phone, emirate and address (one item per order, no cart). ${SITE_NAME} confirms by phone or WhatsApp, then delivers${d?.pickupEnabled ? " or the buyer collects from the warehouse at no charge" : ""}. Payment is cash on delivery or on collection. Items marked "Negotiable" have a WhatsApp "Negotiate" button. Condition tags: New, Premium, Semi-new, Good condition, Fair.

**Selling:** send 1–10 photos, a category, a description and an asking price through the Sell form, then choose "Sell it to HomeLoop" (a cash offer on WhatsApp, usually within 24 hours; free pickup from home; paid in cash on pickup) or "List it on HomeLoop" (the owner sets the price; after approval the item is shown for ${listingDays} days and the owner receives the price minus a ${commission}% commission when it sells).

**Returns and warranty:** inspect the item on delivery; it can be refused at the door if it is damaged or not as described. If it doesn't match its description, report it on WhatsApp within 48 hours of delivery: ${SITE_NAME} collects it free and refunds the full amount, including delivery and service fees (cash on collection, or bank transfer within 7 working days). No change-of-mind returns. Some items ${SITE_NAME} sells itself include a warranty, shown on the item page; owner listings have no warranty.`);

  if (d?.enabled) {
    const cities = d.cityFees.map((c) => `${c.city} ${aed(c.fee)}`).join(", ");
    const services = (s?.services ?? []).map((x) => `${x.name} ${x.fee === 0 ? "free" : aed(x.fee)}`).join(", ");
    out.push(
      `**Delivery and fees:** delivery across the UAE costs ${cities ? `${cities}, other emirates ` : ""}${aed(d.defaultFee)}.${d.freeOver != null ? ` Free delivery on items priced ${aed(d.freeOver)} or more, and on items marked "Free delivery".` : ""}${services ? ` Optional services at checkout: ${services}.` : ""} The total (item + delivery + services) is shown before the order is sent.`,
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
  if (st) {
    const bits = [
      st.whatsapp && `WhatsApp and phone ${st.whatsapp}`,
      st.email,
      st.hours && `hours ${st.hours}`,
      st.address && `${st.address}, United Arab Emirates`,
    ].filter(Boolean);
    if (bits.length) out.push(`**Contact:** ${bits.join("; ")}.`);
  }

  return `${out.join("\n\n")}\n`;
}

function pages(s: Settings): string {
  return `
## Key pages

${[
    link("Home", en("")),
    link("Store", en(routes.store), "all items in stock"),
    link("Sell to HomeLoop", en(routes.sell), "cash offer or list your item"),
    link("Sell all your furniture before moving", en(routes.sellMovingOut), "for people leaving the UAE or moving house"),
    link("Sell appliances", en(routes.sellAppliances), "ACs, fridges, washing machines"),
    s?.moving?.enabled && link("Moving", en(routes.moving), "request a free site visit"),
    s?.technician?.enabled && link("Technicians", en(routes.technician), "plumbing, electrical, AC, curtains, assembly, handyman"),
    link("Condition grades", en(routes.conditionGrades), "what New, Premium, Semi-new, Good and Fair mean"),
    link("Contact", en(routes.contact), "WhatsApp, phone, email, hours"),
    link("About", en(routes.about)),
    link("Terms & conditions", en(routes.terms), "delivery, fees, warranty, returns, owner listings"),
  ]
    .filter(Boolean)
    .join("\n")}
`;
}

function categoriesSection(categories: Category[]): string {
  if (!categories.length) return "";
  return `
## Categories

${categories.map((c) => link(c.name, en(routes.category(c.slug)), `Arabic: ${ar(routes.category(c.slug))}`)).join("\n")}
`;
}

/** Full facts in Arabic (from the Arabic settings), then links to the /ar pages. */
function arabic(s: Settings): string {
  const d = s?.delivery;
  const lines: string[] = [
    `هوم لوب يشتري الأغراض المنزلية المستعملة في الإمارات ويجدّدها ويبيعها أونلاين، ويعرض قطعاً يبيعها أصحابها، ويقدّم خدمات نقل المنازل والمكاتب وزيارات الفنيين. الدفع نقداً عند الاستلام، ولا نقبل التبرعات.`,
    `الشراء: اختر قطعة واضغط "شراء"، ونؤكد معك بالهاتف أو واتساب ثم نوصلها${d?.pickupEnabled ? "، أو تستلمها من المستودع مجاناً" : ""}.`,
    `البيع: أرسل من 1 إلى 10 صور مع الفئة والوصف والسعر، واختر "بِعها لـ هوم لوب" لتحصل على عرض نقدي عبر واتساب واستلام مجاني من منزلك ودفع نقدي، أو "اعرضها على هوم لوب" وتحدد سعرك بنفسك، ونعرضها ${s?.listing?.days ?? 30} يوماً وتحصل على السعر بعد خصم عمولة ${s?.listing?.commissionPercent ?? 10}% عند البيع.`,
  ];
  if (d?.enabled) {
    const fees = [...d.cityFees.map((c) => `${cityName(c.city, "ar")} ${dirham(c.fee)}`), `باقي الإمارات ${dirham(d.defaultFee)}`].join("، ");
    const services = (s?.services ?? []).map((x) => `${x.name} ${x.fee === 0 ? "مجاناً" : dirham(x.fee)}`).join("، ");
    lines.push(
      `التوصيل: ${fees}${d.freeOver != null ? `، والتوصيل مجاني للقطع التي سعرها ${dirham(d.freeOver)} أو أكثر` : ""}.${services ? ` خدمات إضافية عند الطلب: ${services}.` : ""}`,
    );
  }
  lines.push(
    `الإرجاع والضمان: افحص القطعة عند الاستلام، ويمكنك رفضها عند الباب إذا كانت متضررة أو لا تطابق الوصف. وإذا لم تطابق وصفها أخبرنا عبر واتساب خلال 48 ساعة من التوصيل فنستلمها مجاناً ونعيد المبلغ كاملاً بما فيه رسوم التوصيل والخدمات. لا يُقبل الإرجاع لتغيير الرأي. بعض القطع التي نبيعها بأنفسنا عليها ضمان تظهر مدته في صفحتها، وإعلانات المالكين بلا ضمان.`,
  );
  const m = s?.moving;
  if (m?.enabled) {
    lines.push(`النقل: ننقل المنازل والمكاتب داخل الإمارات وبينها، وتبدأ كل عملية نقل بزيارة معاينة مجانية ثم نرسل السعر عبر واتساب. خدمات إضافية: ${m.services.map((x) => x.label).join("، ")}.`);
  }
  const tc = s?.technician;
  if (tc?.enabled && tc.types.length) {
    lines.push(
      `الفنيون: ${tc.types.map((x) => x.name).join("، ")}. ${tc.visitFee != null ? `رسوم الزيارة من ${dirham(tc.visitFee)}.` : "نؤكد السعر معك هاتفياً قبل الزيارة."}`,
    );
  }
  const st = s?.store;
  if (st?.whatsapp) {
    lines.push(`تواصل معنا: واتساب وهاتف ${st.whatsapp}${st.email ? `، ${st.email}` : ""}${st.hours ? `، ساعات العمل ${st.hours}` : ""}.`);
  }

  const links = [
    link("الرئيسية", ar("")),
    link("المتجر", ar(routes.store)),
    link("بِع لـ هوم لوب", ar(routes.sell)),
    link("بِع أجهزتك", ar(routes.sellAppliances)),
    link("مسافر؟ نشتري أثاثك كاملاً", ar(routes.sellMovingOut)),
    m?.enabled && link("النقل – زيارة معاينة مجانية", ar(routes.moving)),
    tc?.enabled && link("اطلب فنياً", ar(routes.technician)),
    link("دليل حالة القطع", ar(routes.conditionGrades)),
    link("تواصل معنا", ar(routes.contact)),
    link("من نحن", ar(routes.about)),
    link("الشروط والأحكام", ar(routes.terms)),
  ].filter(Boolean);

  return `
## بالعربية

${lines.join("\n\n")}

${links.join("\n")}
`;
}

function productFacts(p: Product, s: Settings): string[] {
  // Services free for everyone are stated once above, not on every item.
  const free = (s?.services ?? []).filter((x) => x.fee > 0 && serviceFee(x, p) === 0).map((x) => x.name);
  return [
    p.inspected === false ? "owner listing, not inspected by HomeLoop" : null,
    CONDITION_LABEL[p.condition],
    p.category?.name,
    p.originalPrice ? `was ${metaPrice(p.originalPrice, p.currency, "en")} new` : null,
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

/** Freshness from real data: the newest product change (not "today" on every request). */
export const lastUpdated = (products: Product[]) =>
  (products.map((p) => p.updatedAt ?? p.publishedAt ?? "").sort().at(-1) || new Date().toISOString()).slice(0, 10);

type Input = { categories: Category[]; products: Product[]; settings: Settings; settingsAr: Settings; posts?: BlogCard[] };

function guides(posts: BlogCard[] = []): string {
  if (!posts.length) return "";
  return `
## Guides

${[link("All guides", en(routes.blog), "buying, selling, moving and home services in the UAE"), ...posts.map((p) => link(p.title, en(routes.post(p.slug)), p.excerpt))].join("\n")}
`;
}

/** Short index for AI assistants: /llms.txt */
export function formatLlms({ categories, products, settings, settingsAr, posts }: Input): string {
  const latest = products.slice(0, 30);
  return [
    facts(settings, lastUpdated(products)),
    pages(settings),
    guides(posts),
    categoriesSection(categories),
    latest.length ? `\n## Latest items in stock\n\n${latest.map((p) => productLine(p, settings)).join("\n")}\n` : "",
    arabic(settingsAr),
    optional(false),
  ].join("");
}

/** Long form for retrieval: /llms-full.txt, every in-stock item with its description. */
export function formatLlmsFull({ categories, products, settings, settingsAr, posts }: Input): string {
  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
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
    facts(settings, lastUpdated(products)),
    pages(settings),
    guides(posts),
    categoriesSection(categories),
    catalog.length ? `\n${catalog.join("\n\n")}\n` : `\n## Items in stock\n\n${link("Store", en(routes.store))}\n`,
    arabic(settingsAr),
    optional(true),
  ].join("");
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
  "Access-Control-Allow-Origin": "*",
};
