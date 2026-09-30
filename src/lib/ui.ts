import type { ProductCondition } from "./api";

/** Condition tags in neutral tones, darkest for the best condition. */
export const CONDITION_STYLES: Record<ProductCondition, string> = {
  new: "bg-ink text-white",
  premium: "bg-sand text-ink",
  semi_new: "bg-beige-dark text-ink",
  good: "bg-beige text-ink",
  fair: "bg-surface text-muted ring-1 ring-border",
};

export const CONDITIONS: ProductCondition[] = ["new", "premium", "semi_new", "good", "fair"];

/** Emirates offered in forms. Values are stored in English; show them with `cityName`. */
export const UAE_EMIRATES = {
  en: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"],
  ar: ["دبي", "أبوظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين", "العين"],
};

/** Arabic names for emirate/city values stored in English in settings (e.g. delivery city fees). */
export const CITY_AR: Record<string, string> = Object.fromEntries(UAE_EMIRATES.en.map((c, i) => [c, UAE_EMIRATES.ar[i]]));

export const cityName = (city: string, locale: string) => (locale === "ar" ? (CITY_AR[city] ?? city) : city);
