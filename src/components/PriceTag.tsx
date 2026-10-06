import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/api";
import { Money, PriceOrFree } from "./Money";

export function PriceTag({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const big = size === "lg";

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-extrabold tracking-tight text-ink ${big ? "text-3xl" : "text-lg"}`}>
        <PriceOrFree amount={product.price} currency={product.currency} locale={locale} freeLabel={t("free")} />
      </span>
      {product.originalPrice && (
        <span className={`text-muted line-through ${big ? "text-base" : "text-xs"}`}>
          <Money amount={product.originalPrice} currency={product.currency} locale={locale} />
        </span>
      )}
      {product.savingPercent && (
        <span className="rounded-sm bg-sand px-1.5 py-0.5 text-xs font-bold text-ink">
          {t("save", { percent: product.savingPercent })}
        </span>
      )}
    </div>
  );
}
