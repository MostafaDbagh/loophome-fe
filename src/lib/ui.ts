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

/** Emirates offered in forms when the store hasn't configured city delivery fees. */
export const UAE_EMIRATES = {
  en: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"],
  ar: ["دبي", "أبوظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين", "العين"],
};
