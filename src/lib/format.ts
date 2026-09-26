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

/** Price for titles and meta text: no invisible direction marks, no trailing dot ("950 د.إ" / "AED 950"). */
export const metaPrice = (amount: number, currency: string, locale: Locale | string) =>
  formatPrice(amount, currency, locale).replace(/[\u200e\u200f]/g, "").replace(/\.$/, "").trim();

/** True when the text is mainly Arabic script (used for product text that isn't translated). */
export const isArabic = (text: string) => /[\u0600-\u06ff]/.test(text);

/** `lang` for user-entered text that may not match the page language (untranslated product titles). */
export const textLang = (text: string): "ar" | "en" => (isArabic(text) ? "ar" : "en");
