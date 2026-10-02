import type { Locale } from "@/i18n/routing";

/** "AED 1,150" / "‏1,150 د.إ.‏" with Latin digits in Arabic too, as UAE shops do. */
export function formatPrice(amount: number, currency: string, locale: Locale | string): string {
  return new Intl.NumberFormat(`${locale === "ar" ? "ar-AE" : "en-AE"}-u-nu-latn`, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** wa.me link from an E.164 number ("+971501234567"). */
export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * Price as plain text (titles, meta, FAQ answers, WhatsApp): "950 درهم" / "AED 950". Screens use
 * <Money> with the Dirham symbol; text can't carry the SVG, and people search "درهم".
 */
export function metaPrice(amount: number, currency: string, locale: Locale | string): string {
  const n = new Intl.NumberFormat(`${locale === "ar" ? "ar-AE" : "en-AE"}-u-nu-latn`, { maximumFractionDigits: 0 }).format(amount);
  if (currency === "AED") return locale === "ar" ? `${n} درهم` : `AED ${n}`;
  return formatPrice(amount, currency, locale).replace(/[\u200e\u200f]/g, "").replace(/\.$/, "").trim();
}

/** True when the text is mainly Arabic script (used for product text that isn't translated). */
/** "a, b and c" / "a, b or c" in the page's language (Arabic: "أ وب" / "أ أو ب"). */
export const listOf = (items: string[], locale: Locale | string, type: "conjunction" | "disjunction" = "conjunction") =>
  new Intl.ListFormat(locale === "ar" ? "ar" : "en", { type }).format(items);

export const isArabic = (text: string) => /[\u0600-\u06ff]/.test(text);

/** `lang` for user-entered text that may not match the page language (untranslated product titles). */
export const textLang = (text: string): "ar" | "en" => (isArabic(text) ? "ar" : "en");

const AR_DAYS: Record<string, string> = { sat: "السبت", sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة" };

/** The admin's opening hours in the page language: "Daily 9:00–21:00" → "يومياً 9:00–21:00" (day names too). */
export const storeHours = (hours: string, locale: Locale | string) =>
  locale === "ar"
    ? hours
        .replace(/\b(daily|every day)\b/gi, "يومياً")
        .replace(/\b(sat|sun|mon|tue|wed|thu|fri)\b/gi, (day) => AR_DAYS[day.toLowerCase()])
    : hours;

/**
 * The saving against the admin's "price when new" estimate, or null when there's none to show.
 * Same rule as the API: LoopHome's own items, not below the struck-through price, and at least 1%
 * (rounded down, so a saving is never overstated).
 */
export function whenNewSaving(p: { price: number; originalPrice?: number | null; priceWhenNew?: number | null; inspected?: boolean }) {
  const whenNew = p.priceWhenNew;
  if (!whenNew || p.inspected === false || whenNew < (p.originalPrice ?? p.price)) return null;
  const percent = Math.floor(((whenNew - p.price) * 100) / whenNew);
  return percent >= 1 ? { whenNew, amount: whenNew - p.price, percent } : null;
}
