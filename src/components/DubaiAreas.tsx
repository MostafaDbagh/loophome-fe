import { ArrowRight, MapPin } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AREA_COPY } from "@/content/areas";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlogSitemap } from "@/lib/api";
import { DUBAI_AREAS, routes } from "@/lib/seo/config";

/**
 * The Dubai communities we focus on; each links to its area guide once that post is published.
 * `variant` picks page-specific wording; `current` is the guide being read (shown, not linked).
 */
export async function DubaiAreas({
  locale,
  large = false,
  variant,
  current,
}: {
  locale: Locale;
  large?: boolean;
  variant?: "moving" | "technician" | "sell";
  current?: string;
}) {
  const t = await getTranslations({ locale, namespace: "areas" });
  // A blog API hiccup must not take a service page down: the chips just render without links.
  const posts = await getBlogSitemap().catch((err) => {
    unstable_rethrow(err);
    return [];
  });
  const published = new Set(posts.map((p) => p.slug));
  const linked = (guide: string) => published.has(guide) && guide !== current;
  const anyGuide = DUBAI_AREAS.some((a) => linked(a.guide));
  const chip = "inline-flex items-center gap-1.5 rounded-full border bg-surface px-3.5 py-2 text-sm font-medium";

  return (
    <section aria-labelledby="dubai-areas">
      <h2 id="dubai-areas" className={large ? "text-2xl font-extrabold tracking-tight sm:text-3xl" : "text-xl font-extrabold"}>
        {t(variant ? `${variant}.title` : "title")}
      </h2>
      <p className="mt-2 max-w-2xl text-ink/80">
        {t(variant ? `${variant}.intro` : "intro")}
        {anyGuide && ` ${t("guideHint")}`}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {DUBAI_AREAS.map((a) => (
          <li key={a.guide}>
            {linked(a.guide) ? (
              <Link href={routes.post(a.guide)} className={`${chip} border-ink/40 transition hover:border-ink`}>
                <MapPin aria-hidden className="size-4 text-muted" />
                {a[locale]}
                <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
              </Link>
            ) : (
              <span className={`${chip} border-border`} aria-current={a.guide === current ? "page" : undefined}>
                <MapPin aria-hidden className="size-4 text-muted" />
                {a[locale]}
              </span>
            )}
          </li>
        ))}
      </ul>
      {/* The area pages are about selling to us, so movers' and technicians' lists don't link them. */}
      {variant !== "moving" && variant !== "technician" && (
        <Link href={routes.areas} className="mt-4 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          {AREA_COPY[locale].index.all}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      )}
    </section>
  );
}
