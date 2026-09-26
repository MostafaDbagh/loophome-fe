"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/** A real link to the same page in the other language, so crawlers can follow it. */
export function LocaleSwitch() {
  const t = useTranslations("nav");
  const other = useLocale() === "ar" ? "en" : "ar";
  const pathname = usePathname();

  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={other === "ar" ? "ar-AE" : "en-AE"}
      lang={other}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition hover:bg-beige sm:px-3"
    >
      <Globe className="size-4" />
      <span className="sr-only sm:not-sr-only">{t("language")}</span>
      <span aria-hidden className="sm:hidden">
        {other === "en" ? "EN" : "ع"}
      </span>
    </Link>
  );
}
