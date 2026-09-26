import { CalendarDays, Eye, Hash } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { Product } from "@/lib/api";

/** "Ref HL-000123 · 42 views · Published 3 days ago". Works in server and client trees. */
export function ProductMeta({
  product,
  className = "",
  showRef = true,
}: {
  product: Product;
  className?: string;
  /** The reference is shown on the product page only, not on cards. */
  showRef?: boolean;
}) {
  const t = useTranslations("product");
  const format = useFormatter();
  const now = useNow();
  const published = product.publishedAt ? new Date(product.publishedAt) : null;

  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted ${className}`}>
      {showRef && product.ref && (
        <span className="inline-flex items-center gap-1">
          <Hash aria-hidden className="size-3.5" />
          <span dir="ltr">{t("ref", { ref: product.ref })}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Eye aria-hidden className="size-3.5" />
        {t("views", { count: product.views ?? 0 })}
      </span>
      {published && (
        <span className="inline-flex items-center gap-1">
          <CalendarDays aria-hidden className="size-3.5" />
          <time dateTime={published.toISOString()}>
            {t("published", { when: format.relativeTime(published, now) })}
          </time>
        </span>
      )}
    </p>
  );
}
