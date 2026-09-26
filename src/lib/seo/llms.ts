/**
 * /llms.txt and /llms-full.txt (llmstxt.org format): an H1, a blockquote summary,
 * short prose, then H2 sections of markdown links. Fees, services and contact details
 * come from live settings so assistants quote current numbers.
 */
import type { Category, Product, PublicSettings } from "@/lib/api";
import { hasFreeDelivery, serviceFee } from "@/lib/fees";
import { metaPrice } from "@/lib/format";
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
const link = (name: string, url: string, note?: string) => `- [${name}](${url})${note ? `: ${note}` : ""}`;

function header(settings: PublicSettings | null, updated: string): string {
  return `# ${SITE_NAME} (هوم لوب)

> ${SITE_NAME} buys used home items from people in the United Arab Emirates, refurbishes and sells them in its own online store, and also sells items listed by their owners. Cash on delivery. It serves ${UAE_CITIES.join(", ")}, in Arabic and English.

Last updated: ${updated}

${SITE_NAME} mainly buys, refurbishes and resells items itself; those are inspected and often carry a warranty. It also sells items on behalf of their owners ("owner listings"), tagged "Unchecked by our experts": ${SITE_NAME} handles the order and delivery but does not inspect or guarantee them, and they have no warranty. Owners' contact details are never shown. It serves the United Arab Emirates only. There are no customer accounts; people order or sell with a name and phone number.

**Buying:** choose an item and tap "Buy", then enter name, phone, emirate and address (one item per order, no cart). Optional services such as installation can be added. ${SITE_NAME} confirms by phone or WhatsApp, then delivers${settings?.delivery.pickupEnabled ? " or the buyer collects from the warehouse" : ""}. Payment is cash on delivery or on collection. Items marked "Negotiable" have a WhatsApp "Negotiate" button. Each item carries a condition tag: New, Premium, Semi-new, Good condition or Fair.

**Selling:** send 1–10 photos, a category, a description and an asking price through the Sell form, then choose either "Sell it to HomeLoop" (the team replies on WhatsApp with a cash offer, collects the item from home for free and pays in cash on pickup) or "List it on HomeLoop" (the owner sets the price; after approval the item is shown for ${settings?.listing?.days ?? 30} days and the owner receives the price minus a ${settings?.listing?.commissionPercent ?? 10}% commission when it sells). HomeLoop does not accept donations.

**Returns and warranty:** if an item doesn't match its description, report it within 48 hours of delivery for a return and full refund. Some items HomeLoop sells itself include a warranty; the period is shown on the item page. Owner listings have no warranty.
${fees(settings)}${contact(settings)}`;
}

function fees(settings: PublicSettings | null): string {
  if (!settings) return "";
  const d = settings.delivery;
  const lines = ["", "## Delivery, fees and services", ""];
  if (d.enabled) {
    const cities = d.cityFees.map((c) => `${c.city} ${aed(c.fee)}`).join(", ");
    lines.push(`- Delivery across the UAE. Fee: ${cities ? `${cities}, other emirates ` : ""}${aed(d.defaultFee)}.`);
    if (d.freeOver != null) lines.push(`- Free delivery on items priced ${aed(d.freeOver)} or more, and on items marked "Free delivery".`);
  }
  if (d.pickupEnabled) lines.push("- Buyers can collect their order from our warehouse at no charge.");
  for (const s of settings.services) {
    lines.push(`- Optional service: ${s.name}, ${s.fee === 0 ? "free" : aed(s.fee)}${s.categories.length ? " (selected categories)" : ""}.`);
  }
  lines.push("- The total (item + delivery + services) is shown before the order is sent.");
  return `${lines.join("\n")}\n`;
}

function contact(settings: PublicSettings | null): string {
  const s = settings?.store;
  if (!s) return "";
  const lines = ["", "## Contact", ""];
  if (s.whatsapp) lines.push(link(`WhatsApp ${s.whatsapp}`, `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`));
  if (s.phone) lines.push(`- Phone: ${s.phone}`);
  if (s.email) lines.push(`- Email: ${s.email}`);
  if (s.address) lines.push(`- Address: ${s.address}, United Arab Emirates`);
  if (s.hours) lines.push(`- Hours: ${s.hours}`);
  lines.push(link("Contact page", en(routes.contact)));
  return `${lines.join("\n")}\n`;
}

function pages(): string {
  return `
## Key pages

${link("Store", en(routes.store), "all items in stock")}
${link("Sell to HomeLoop", en(routes.sell), "get an offer for used furniture and appliances")}
${link("We buy your whole home", en(routes.sellMovingOut), "for people leaving the UAE or moving house")}
${link("Sell appliances", en(routes.sellAppliances), "ACs, fridges, washing machines")}
${link("Condition grades", en(routes.conditionGrades), "what New, Premium, Semi-new, Good and Fair mean")}
${link("About", en(routes.about))}
${link("Terms & conditions", en(routes.terms), "delivery, service fees, warranty, returns")}
`;
}

function categoriesSection(categories: Category[]): string {
  if (!categories.length) return "";
  return `
## Categories

${categories.map((c) => link(c.name, en(routes.category(c.slug)), `Arabic: ${ar(routes.category(c.slug))}`)).join("\n")}
`;
}

function arabic(settings: PublicSettings | null): string {
  const d = settings?.delivery;
  const fees = d?.enabled
    ? `رسوم التوصيل: ${d.cityFees.map((c) => `${c.city === "Dubai" ? "دبي" : c.city === "Sharjah" ? "الشارقة" : c.city === "Abu Dhabi" ? "أبوظبي" : c.city} ${c.fee} درهم`).join("، ")}، وباقي الإمارات ${d.defaultFee} درهم${d.freeOver != null ? `، والتوصيل مجاني للقطع من ${d.freeOver} درهم` : ""}.`
    : "";
  const listing = settings?.listing
    ? `إعلانات المالكين: قطع يعرضها أصحابها بوسم "غير مفحوص من خبرائنا"، لا نفحصها ولا نضمنها وليس عليها ضمان، ويحصل المالك على السعر ناقص ${settings.listing.commissionPercent}% عند البيع، ومدة العرض ${settings.listing.days} يوماً.`
    : "";
  return `
## بالعربية

هوم لوب يشتري الأغراض المنزلية المستعملة في الإمارات، يجدّدها، ويبيعها في متجره الإلكتروني مع الدفع عند الاستلام. نخدم دبي وأبوظبي والشارقة وجميع الإمارات. للشراء: اختر قطعة واضغط "شراء" ونؤكد عبر واتساب، ويمكن الاستلام من المستودع مجاناً. للبيع: أرسل الصور ونرسل لك عرضاً نقدياً ونستلم القطعة من منزلك مجاناً. لا نقبل التبرعات.
${fees ? `
${fees}
` : ""}${listing ? `
${listing}
` : ""}
الإرجاع: إذا لم تطابق القطعة وصفها أخبرنا خلال 48 ساعة من التوصيل لإرجاعها واسترداد المبلغ كاملاً، ولا يُقبل الإرجاع لتغيير الرأي.

${link("المتجر", ar(routes.store))}
${link("بِع لهوم لوب", ar(routes.sell))}
${link("تواصل معنا", ar(routes.contact))}
${link("الشروط والأحكام", ar(routes.terms))}
${link("دليل حالة القطع", ar(routes.conditionGrades))}
${link("مسافر؟ نشتري أثاثك كاملاً", ar(routes.sellMovingOut))}
`;
}

function productFacts(p: Product, settings: PublicSettings | null): string[] {
  // Services that are free for everyone are listed once in the fees section, not on every item.
  const free = (settings?.services ?? [])
    .filter((s) => s.fee > 0 && serviceFee(s, p) === 0)
    .map((s) => s.name);
  return [
    p.inspected === false ? "owner listing, not inspected by HomeLoop" : null,
    CONDITION_LABEL[p.condition],
    p.category?.name,
    p.originalPrice ? `was ${metaPrice(p.originalPrice, p.currency, "en")} new` : null,
    p.warrantyDays ? `${p.warrantyDays}-day warranty` : null,
    hasFreeDelivery(p, settings) ? "free delivery" : null,
    free.length ? `free ${free.join(", ")}` : null,
    p.negotiable ? "negotiable" : null,
  ].filter(Boolean) as string[];
}

const productLine = (p: Product, settings: PublicSettings | null) =>
  link(p.title, en(routes.product(p.slug)), `${metaPrice(p.price, p.currency, "en")} (${productFacts(p, settings).join(", ")})`);

const optional = (full: boolean) => `
## Optional

${full ? "" : `${link("Full catalogue for AI", `${SITE_URL}${AI_FILES.llmsFull}`, "every item in stock with descriptions")}\n`}${link("Privacy policy", en(routes.privacy))}
${link("Sitemap", `${SITE_URL}/sitemap.xml`)}
`;

/** Short index for AI assistants: /llms.txt */
/** Freshness from real data: the newest product change (not "today" on every request). */
const lastUpdated = (products: Product[]) =>
  (products.map((p) => p.updatedAt ?? p.publishedAt ?? "").sort().at(-1) || new Date().toISOString()).slice(0, 10);

export function formatLlms(categories: Category[], products: Product[], settings: PublicSettings | null): string {
  const latest = products.slice(0, 30);
  return [
    header(settings, lastUpdated(products)),
    pages(),
    categoriesSection(categories),
    latest.length ? `\n## Latest items in stock\n\n${latest.map((p) => productLine(p, settings)).join("\n")}\n` : "",
    arabic(settings),
    optional(false),
  ].join("");
}

/** Long form for retrieval: /llms-full.txt, every in-stock item with its description. */
export function formatLlmsFull(categories: Category[], products: Product[], settings: PublicSettings | null): string {
  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.category?.name ?? "Other";
    byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
  }
  const catalog = [...byCategory.entries()].map(([name, list]) =>
    [
      `### ${name} (${list.length})`,
      "",
      ...list.map((p) =>
        [productLine(p, settings), p.description ? `  ${p.description.replace(/\s+/g, " ").trim()}` : ""]
          .filter(Boolean)
          .join("\n"),
      ),
    ].join("\n"),
  );

  return [
    header(settings, lastUpdated(products)),
    pages(),
    categoriesSection(categories),
    `\n## Items in stock (${products.length})\n\n`,
    catalog.length ? catalog.join("\n\n") : link("Store", en(routes.store)),
    "\n",
    arabic(settings),
    optional(true),
  ].join("");
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
  "Access-Control-Allow-Origin": "*",
};
