import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // Every URL carries its locale so each language has one stable, indexable URL.
  localePrefix: "always",
  localeDetection: false,
  // The locale never comes from a cookie, and hreflang is emitted in <head> and the
  // sitemap as ar-AE/en-AE; next-intl's own Link header would contradict both.
  localeCookie: false,
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
