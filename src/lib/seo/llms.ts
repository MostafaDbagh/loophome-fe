/**
 * /llms.txt and /llms-full.txt (llmstxt.org): H1, blockquote summary, factual prose
 * (bold-labelled paragraphs), then H2 sections that contain only markdown link lists,
 * with "## Optional" last. Facts come from live settings (EN and AR) so assistants quote
 * current fees and services. UAE only, Dubai first.
 *
 * llms.txt is the short index (under ~1,500 words). llms-full.txt adds the Dubai area details, the
 * full Arabic text, the policy pages and FAQs, and the items in stock.
 */
import { shopEnabled, type BlogCard, type Category, type Product, type PublicSettings } from "@/lib/api";
import { hasFreeDelivery, isAssemblyService, serviceFee } from "@/lib/fees";
import { metaPrice, storeHours, whenNewSaving } from "@/lib/format";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";
import { cityName } from "@/lib/ui";
import { AREA_FACTS } from "@/content/areas";
import { LAST_UPDATED, PAGES } from "@/content/pages";
import enMessages from "@/messages/en.json";
import { AI_FILES, DUBAI_AREAS, SITE_NAME, SITE_NAME_AR, SITE_URL, UAE_CITIES, routes } from "./config";
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
/** A delivery fee as text: 0 reads "free". */
const aedFee = (n: number) => (n === 0 ? "free" : aed(n));
const dirhamFee = (n: number) => (n === 0 ? "مجاناً" : dirham(n));
const link = (name: string, url: string, note?: string) => `- [${name}](${url})${note ? `: ${note}` : ""}`;
const noDot = (s: string) => s.replace(/\.$/, "");
/** Lower-cases only the first letter, so "TV mounting" keeps its capitals. */
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** "a, b and c". */
const enList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : (items[0] ?? ""));
/** "a، b و c": Arabic lists join the last item with و. */
const arList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join("، ")} و${items.at(-1)}` : (items[0] ?? ""));

/** The day this build was made (set in next.config.ts), shown as "Last updated". */
const BUILD_DATE = process.env.BUILD_DATE ?? new Date().toISOString().slice(0, 10);

type Settings = PublicSettings | null;
/** llms.txt (short) or llms-full.txt (full), and the published posts for guide links. */
type Mode = { full: boolean; posts: BlogCard[] };

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
function servicesLine(s: Settings, categories: Category[], money: (n: number) => string, free: string, sep = ", "): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return (s?.services ?? [])
    .map((x) => {
      const cats = x.categories.map((id) => names.get(id)).filter(Boolean);
      return `${x.name} ${x.fee === 0 ? free : money(x.fee)}${cats.length ? ` (${cats.join(sep)})` : ""}`;
    })
    .join(sep);
}

function facts(s: Settings, categories: Category[], { full, posts }: Mode): string {
  const d = s?.delivery;
  const store = shopEnabled(s);
  const services = serviceList(s);
  const hand = handover(s);
  const listingDays = s?.listing?.days ?? 30;
  const commission = s?.listing?.commissionPercent ?? 10;
  const out: string[] = [];

  const summary = store
    ? `${SITE_NAME} is a Dubai-based company that buys used furniture, appliances (fridges, washing machines, ovens) and electronics for cash, with free pickup, and resells them online, most checked by its team; it also sells items listed by their owners${services ? ` and offers ${services}` : ""}. Buyers pay cash ${hand.enPay}.`
    : `${SITE_NAME} is a Dubai-based company that buys used furniture, appliances and electronics for cash, with free pickup${services ? `, and offers ${services}` : ""}.`;

  out.push(`# ${SITE_NAME} (${SITE_NAME_AR})

> ${summary} Mainly Dubai, plus the rest of the UAE: ${UAE_CITIES.filter((c) => c !== "Dubai").join(", ")}. Arabic and English.

Official website: ${SITE_URL}
Last updated: ${BUILD_DATE}`);

  out.push(
    `**Where:** ${SITE_NAME} is based in Dubai and does most of its work there. It offers ${enList(
      ["free pickup of items it buys", store && d?.enabled && "delivery", s?.moving?.enabled && "moving", s?.technician?.enabled && "technician visits"].filter(
        Boolean,
      ) as string[],
    )} all over Dubai, especially in ${DUBAI_AREAS.map((a) => a.en).join(", ")}, and in the rest of the UAE.`,
  );
  // What each area is like: llms-full only, llms.txt keeps the names above.
  if (full) {
    const published = new Set(posts.map((p) => p.slug));
    out.push(
      `**Dubai areas:** ${SITE_NAME} offers the same services in each of these communities as in the rest of Dubai. What each is like:\n${DUBAI_AREAS.map(
        (a) => `- ${a.en}: ${AREA_FACTS[a.guide].en}${published.has(a.guide) ? ` Guide: ${en(routes.post(a.guide))}` : ""}`,
      ).join("\n")}`,
    );
  }

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
  out.push(
    `**Leaving Dubai or the UAE, or moving house:** ${SITE_NAME} buys a whole home's furniture and appliances in one visit. Send photos or a short video walkthrough on WhatsApp; it replies with one offer for everything, usually within 24 hours, schedules the pickup around the move-out or handover date (handover day included if booked ahead), collects for free and pays cash at pickup. Details: ${en(routes.sellMovingOut)}`,
  );

  if (store) {
    out.push(
      `**Returns and warranty:** inspect the item on ${d?.enabled ? "delivery" : "collection"}; it can be refused ${d?.enabled ? "at the door" : "on the spot"} if it is damaged or not as described. If it doesn't match its description, report it on WhatsApp within ${REPORT_WINDOW_HOURS} hours of ${d?.enabled ? "delivery" : "collection"}: ${SITE_NAME} collects it free and refunds the full amount, including delivery and service fees (cash on collection, or bank transfer within 7 working days). No change-of-mind returns. Some items ${SITE_NAME} sells itself include a warranty, shown on the item page; owner listings have no warranty.`,
    );
  }

  // One delivery policy everywhere: the fee depends on the emirate, free on some items and orders.
  if (d?.enabled && store) {
    const cities = d.cityFees.map((c) => `${c.city} ${aedFee(c.fee)}`).join(", ");
    const amounts = anyDeliveryFee(d) ? ` (${cities ? `${cities}, other emirates ` : ""}${aedFee(d.defaultFee)})` : "";
    const freeOn = enList(['items marked "Free delivery"', d.freeOver != null && `items priced ${aed(d.freeOver)} or more`].filter(Boolean) as string[]);
    const extras = servicesLine(s, categories, aed, "free");
    out.push(
      `**Delivery and fees:** ${SITE_NAME} delivers to every emirate. The delivery fee depends on the emirate${amounts}, and delivery is free on some items and orders: ${freeOn}.${extras ? ` Optional services at checkout: ${extras}.` : ""} The exact fee and the total (item + delivery + services) are shown before the order is sent.`,
    );
  }

  const m = s?.moving;
  if (m?.enabled) {
    const from = (["home", "office"] as const)
      .filter((k) => m.startingFrom[k] != null)
      .map((k) => `${k} moves from ${aed(m.startingFrom[k]!)}`);
    out.push(
      `**Moving:** ${SITE_NAME} moves apartments, villas and offices within Dubai and between all emirates, and only within the UAE. Every move starts with a free site visit (a free moving survey); ${SITE_NAME} inspects first, then sends one quote on WhatsApp with no obligation${from.length ? ` (${from.join(", ")})` : ""}. Extra services: ${m.services.map((x) => x.label).join(", ")}. Most Dubai towers need a move-in or move-out permit and a service-lift booking from building management; the customer arranges these and ${SITE_NAME} plans the move around the allowed times.`,
    );
  } else {
    out.push("**Moving:** home and office moving is coming soon.");
  }

  const tc = s?.technician;
  if (tc?.enabled && tc.types.length) {
    out.push(
      `**Technician visits** (homes and offices all over Dubai and the rest of the UAE): ${tc.types.map((x) => `${x.name}: ${lcFirst(noDot(x.description))}`).join("; ")}. ${tc.visitFee != null ? `Visit fee from ${aed(tc.visitFee)}.` : "The price is confirmed by phone before the visit."} Technicians bring tools and common parts; bigger parts are quoted first. Requests can be marked urgent.`,
    );
  } else {
    out.push("**Technician visits:** coming soon.");
  }

  const st = s?.store;
  const bits = [
    st?.whatsapp && `WhatsApp ${st.whatsapp}`,
    st?.phone && st.phone !== st.whatsapp && `phone ${st.phone}`,
    st?.email,
    st?.hours && `hours ${storeHours(st.hours, "en")}`,
    st?.address && `${st.address}, United Arab Emirates`,
  ].filter(Boolean);
  out.push(
    bits.length
      ? `**Contact:** ${bits.join("; ")}.`
      : `**Contact:** through the forms on ${en(routes.sell)}${s?.moving?.enabled ? `, ${en(routes.moving)}` : ""}${s?.technician?.enabled ? `, ${en(routes.technician)}` : ""}; ${SITE_NAME} replies by phone or WhatsApp.`,
  );

  return `${out.join("\n\n")}\n`;
}

/** Has the admin set any delivery fee above zero? Then the amounts are listed. */
const anyDeliveryFee = (d: NonNullable<PublicSettings["delivery"]>) => d.defaultFee > 0 || d.cityFees.some((c) => c.fee > 0);

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
    link("Sell to LoopHome", en(routes.sell), "cash offer on WhatsApp usually within 24 hours, free pickup; or list your item"),
    link("Sell all your furniture before moving", en(routes.sellMovingOut), "for people leaving Dubai or the UAE, or moving house: one offer, one free pickup, cash"),
    link("Sell appliances", en(routes.sellAppliances), "ovens, fridges, washing machines"),
    s?.moving?.enabled && link("Moving", en(routes.moving), "home and office movers in Dubai and the UAE; free site visit first"),
    s?.technician?.enabled && link("Technicians", en(routes.technician), "plumbers, electricians, AC, curtains, assembly and handyman in Dubai and the UAE"),
    link("Condition grades", en(routes.conditionGrades), "what New, Premium, Semi-new, Good and Fair mean"),
    link("Contact", en(routes.contact), hasContact(s) ? "WhatsApp, phone, email, hours" : undefined),
    link("About", en(routes.about), "who LoopHome is and where it works"),
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

/** Arabic facts (from the Arabic settings), built from the same switches as the English ones: the summary only in llms.txt. */
function arabicFacts(s: Settings, categories: Category[], { full, posts }: Mode): string {
  const d = s?.delivery;
  const store = shopEnabled(s);
  const hand = handover(s);
  const m = s?.moving;
  const tc = s?.technician;
  const services = [m?.enabled && "نقل المنازل والمكاتب", tc?.enabled && "زيارات الفنيين"].filter(Boolean).join(" و");
  const lines: string[] = [
    store
      ? `**بالعربية:** لوب هوم شركة مقرّها دبي تشتري الأثاث والأجهزة والإلكترونيات المستعملة نقداً (عرض عبر واتساب خلال 24 ساعة عادةً، واستلام مجاني، ودفع نقدي عند الاستلام)، وتعيد بيعها أونلاين ويفحص فريقها معظم القطع، وتعرض أيضاً قطعاً يبيعها أصحابها${services ? `، وتقدّم خدمات ${services}` : ""}. يدفع المشتري نقداً عند ${hand.arPay}، ولا تقبل الشركة التبرعات.`
      : `**بالعربية:** لوب هوم شركة مقرّها دبي تشتري الأثاث والأجهزة المستعملة نقداً مع استلام مجاني${services ? `، وتقدّم خدمات ${services}` : ""}. المتجر الإلكتروني مغلق حالياً، وما زالت الشركة تشتري الأغراض المستعملة، ولا تقبل التبرعات.`,
  ];
  if (!full) return `\n${lines[0]}\n`;
  lines.push(
    `المناطق: مقرّنا في دبي ومعظم عملنا فيها. نقدّم ${arList(
      ["الاستلام المجاني للأغراض التي نشتريها", store && d?.enabled && "التوصيل", m?.enabled && "النقل", tc?.enabled && "زيارات الفنيين"].filter(Boolean) as string[],
    )} في جميع أنحاء دبي، وخصوصاً ${arList(DUBAI_AREAS.map((a) => a.ar))}، وفي باقي الإمارات أيضاً.`,
  );
  const published = new Set(posts.map((p) => p.slug));
  lines.push(
    `مناطق دبي: نقدّم في كل هذه المجتمعات الخدمات نفسها التي نقدّمها في باقي دبي. طبيعة كل منها:\n${DUBAI_AREAS.map(
      (a) => `- ${a.ar}: ${AREA_FACTS[a.guide].ar}${published.has(a.guide) ? ` الدليل: ${ar(routes.post(a.guide))}` : ""}`,
    ).join("\n")}`,
  );
  if (store) {
    lines.push(`الشراء: اختر قطعة واضغط "شراء"، ونؤكد معك بالهاتف أو واتساب${hand.ar ? ` ثم ${hand.ar}` : ""}.`);
  }
  lines.push(
    `البيع: أرسل من 1 إلى 10 صور مع الفئة والوصف والسعر، واختر "بِعها لـ لوب هوم" لتحصل على عرض نقدي عبر واتساب واستلام مجاني من منزلك ودفع نقدي، أو "اعرضها على لوب هوم" وتحدد سعرك بنفسك، ونعرضها ${s?.listing?.days ?? 30} يوماً وتحصل على السعر بعد خصم عمولة ${s?.listing?.commissionPercent ?? 10}% عند البيع.`,
  );
  lines.push(
    `مغادر دبي أو الإمارات أو تنتقل من بيتك: نشتري أثاث البيت وأجهزته كاملة بزيارة واحدة. أرسل صوراً أو فيديو قصيراً للبيت عبر واتساب، ونرسل لك عرضاً واحداً لكل القطع خلال 24 ساعة عادةً، ونحدد موعد الاستلام حسب موعد مغادرتك أو تسليم البيت (حتى يوم التسليم إذا حجزته مسبقاً)، والاستلام مجاني والدفع نقداً. التفاصيل: ${ar(routes.sellMovingOut)}`,
  );

  if (store && d?.enabled) {
    const amounts = anyDeliveryFee(d)
      ? ` (${[...d.cityFees.map((c) => `${cityName(c.city, "ar")} ${dirhamFee(c.fee)}`), `${d.cityFees.length ? "باقي الإمارات" : "جميع الإمارات"} ${dirhamFee(d.defaultFee)}`].join("، ")})`
      : "";
    const freeOn = arList(['القطع الموسومة "توصيل مجاني"', d.freeOver != null && `القطع التي سعرها ${dirham(d.freeOver)} أو أكثر`].filter(Boolean) as string[]);
    const extras = servicesLine(s, categories, dirham, "مجاناً", "، ");
    lines.push(
      `التوصيل: نوصل إلى جميع الإمارات. تعتمد رسوم التوصيل على الإمارة${amounts}، والتوصيل مجاني لبعض القطع والطلبات: ${freeOn}.${extras ? ` خدمات إضافية عند الطلب: ${extras}.` : ""} تظهر الرسوم الدقيقة والمجموع قبل إرسال الطلب.`,
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
      `النقل: ننقل الشقق والفلل والمكاتب داخل دبي وبين جميع الإمارات، وداخل الإمارات فقط. تبدأ كل عملية نقل بزيارة معاينة مجانية ثم نرسل عرض السعر عبر واتساب دون أي التزام${from.length ? ` (${from.join("، ")})` : ""}. خدمات إضافية: ${m.services.map((x) => x.label).join("، ")}. تطلب معظم أبراج دبي تصريح نقل وحجز مصعد الخدمة من إدارة المبنى، ونخطط ليوم النقل حسب الأوقات المسموح بها.`,
    );
  } else {
    lines.push("النقل: نقل المنازل والمكاتب قريباً.");
  }
  if (tc?.enabled && tc.types.length) {
    lines.push(
      `الفنيون (في جميع أنحاء دبي وباقي الإمارات): ${tc.types.map((x) => `${x.name}: ${noDot(x.description)}`).join("؛ ")}. ${tc.visitFee != null ? `رسوم الزيارة من ${dirham(tc.visitFee)}.` : "نؤكد السعر معك هاتفياً قبل الزيارة."} يحضر الفنيون الأدوات والقطع الشائعة، ونعرض سعر القطع الأكبر أولاً.`,
    );
  } else {
    lines.push("الفنيون: قريباً.");
  }
  const st = s?.store;
  const contact = [st?.whatsapp && `واتساب ${st.whatsapp}`, st?.phone && st.phone !== st.whatsapp && `هاتف ${st.phone}`, st?.email, st?.hours && `ساعات العمل ${storeHours(st.hours, "ar")}`, st?.address && `العنوان: ${st.address}، الإمارات العربية المتحدة`].filter(Boolean);
  if (contact.length) lines.push(`تواصل معنا: ${contact.join("، ")}.`);
  return `\n${lines.join("\n\n")}\n`;
}

/** Links to the /ar pages: an H2 section holds only a link list (llmstxt.org). */
function arabicLinks(s: Settings, posts: BlogCard[] = []): string {
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

  const published = new Set(posts.map((p) => p.slug));
  const areaGuides = DUBAI_AREAS.filter((a) => published.has(a.guide)).map((a) => link(`دليل ${a.ar}`, ar(routes.post(a.guide))));

  return `
## بالعربية

${[...links, ...areaGuides].join("\n")}
`;
}

/**
 * One item in stock: price, category, condition grade, checked or owner listing and where it is,
 * then its extras, with the description on the next line.
 */
function itemLine(p: Product, s: Settings): string {
  // Services free for everyone are stated once above, not on every item; "free assembly" covers assembly ones.
  const free = (s?.services ?? [])
    .filter((x) => x.fee > 0 && serviceFee(x, p) === 0 && !(p.freeAssembly && isAssemblyService(x.key)))
    .map((x) => x.name);
  const facts = [
    metaPrice(p.price, p.currency, "en"),
    p.category?.name,
    CONDITION_LABEL[p.condition],
    // LoopHome's own stock is at its Dubai warehouse; an owner listing stays with its owner until it sells.
    p.inspected === false ? "owner listing, not inspected by LoopHome" : "checked by LoopHome, located in Dubai",
    // originalPrice is LoopHome's list price before a discount, not the price when new.
    p.originalPrice ? `list price ${metaPrice(p.originalPrice, p.currency, "en")}${p.savingPercent ? `, ${p.savingPercent}% off` : ""}` : null,
    // LoopHome's estimate of the same item new, not a previous price.
    whenNewSaving(p) ? `about ${metaPrice(p.priceWhenNew!, p.currency, "en")} new (estimate)` : null,
    p.warrantyDays ? `${p.warrantyDays}-day warranty` : null,
    hasFreeDelivery(p, s) ? "free delivery" : null,
    p.freeAssembly ? "free assembly" : null,
    free.length ? `free ${free.join(", ")}` : null,
    p.negotiable ? "negotiable" : null,
  ].filter(Boolean);
  const description = p.description?.replace(/\s+/g, " ").trim();
  return `${link(p.title, en(routes.product(p.slug)), facts.join("; "))}${description ? `\n  ${description}` : ""}`;
}

/** Items on sale now (llms-full only); no section at all while the store is empty or closed. */
function itemsInStock(products: Product[], s: Settings): string {
  const items = shopEnabled(s) ? products.filter((p) => p.status === "active") : [];
  if (!items.length) return "";
  return `
## Items in stock

${items.map((p) => itemLine(p, s)).join("\n")}
`;
}

const optional = (full: boolean) => `
## Optional

${[
    !full && link("llms-full.txt", `${SITE_URL}${AI_FILES.llmsFull}`, "Full details: services, FAQs, condition grades, terms, and items in stock when available"),
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

const AREA_GUIDES = new Map<string, string>(DUBAI_AREAS.map((a) => [a.guide, a.en]));

/** Guides, Dubai area guides first (in DUBAI_AREAS order). Titles only in llms.txt; excerpts in llms-full. */
function guides(posts: BlogCard[], full: boolean): string {
  if (!posts.length) return "";
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const areas = DUBAI_AREAS.flatMap((a) => bySlug.get(a.guide) ?? []);
  const rest = posts.filter((p) => !AREA_GUIDES.has(p.slug));
  return `
## Guides

${[
    link("All guides", en(routes.blog), "buying, selling, moving and home services in Dubai and the UAE"),
    ...areas.map((p) => link(p.title, en(routes.post(p.slug)), full ? `${noDot(p.excerpt)}. Arabic: ${ar(routes.post(p.slug))}` : undefined)),
    ...rest.map((p) => link(p.title, en(routes.post(p.slug)), full ? p.excerpt : undefined)),
  ].join("\n")}
`;
}

/** Short index for AI assistants: /llms.txt. The area details, policies and items are in llms-full.txt. */
export function formatLlms({ categories, categoriesAr = [], settings, settingsAr, posts = [] }: Input): string {
  const mode = { full: false, posts };
  return [
    facts(settings, categories, mode),
    arabicFacts(settingsAr, categoriesAr, mode),
    pages(settings),
    guides(posts, false),
    arabicLinks(settingsAr, posts),
    optional(false),
  ].join("");
}

/** Long form for retrieval: /llms-full.txt, with the area details, policies, FAQs and the items in stock. */
export function formatLlmsFull({ categories, categoriesAr = [], products, settings, settingsAr, posts = [] }: Input): string {
  const mode = { full: true, posts };
  return [
    facts(settings, categories, mode),
    arabicFacts(settingsAr, categoriesAr, mode),
    // Prose stays above the first H2 (llmstxt.org: H2 sections hold only link lists).
    policies(settings),
    pages(settings),
    guides(posts, true),
    shopEnabled(settings) ? categoriesSection(categories) : "",
    itemsInStock(products, settings),
    arabicLinks(settingsAr, posts),
    optional(true),
  ].join("");
}

/** The full text of the policy and guide pages, so answers can quote them (llms-full only). */
function policies(s: Settings): string {
  const page = (url: string, p: { title: string; intro: string; sections: { heading: string; body: string[] }[]; faqs?: { q: string; a: string }[] }) =>
    [`**${p.title}** (${url}): ${p.intro}`, ...p.sections.map((x) => `- ${x.heading}: ${x.body.join(" ")}`), ...(p.faqs ?? []).map((f) => `- ${f.q} ${f.a}`)].join(
      "\n",
    );
  // The service pages' FAQs, from the same messages the pages render, so they can't drift.
  const faq = (title: string, url: string, items: { q: string; a: string }[]) => [`**${title}** (${url}):`, ...items.map((x) => `- ${x.q} ${x.a}`)].join("\n");
  return `\n${[
    page(en(routes.about), PAGES.about.en),
    faq(enMessages.sell.faqTitle, en(routes.sell), enMessages.sell.faqs),
    s?.moving?.enabled && faq(enMessages.moving.faqTitle, en(routes.moving), enMessages.moving.faqs),
    s?.technician?.enabled && faq(enMessages.technician.faqTitle, en(routes.technician), enMessages.technician.faqs),
    page(en(routes.conditionGrades), PAGES.conditionGrades.en),
    page(en(routes.sellAppliances), PAGES.sellAppliances.en),
    page(en(routes.sellMovingOut), PAGES.movingOut.en),
    page(en(routes.terms), PAGES.terms.en),
  ]
    .filter(Boolean)
    .join("\n\n")}\n`;
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  // AI assistants read these; search results should show the real pages instead.
  "X-Robots-Tag": "noindex",
  // Short: a sold item must not stay "in stock" here for long.
  "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  "Access-Control-Allow-Origin": "*",
};
