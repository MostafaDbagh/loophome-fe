import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { textLang } from "@/lib/format";
import type { Product } from "@/lib/api";
import { ConditionBadge } from "./ConditionBadge";
import { PriceTag } from "./PriceTag";
import { UncheckedBadge } from "./UncheckedBadge";
import { ProductMeta } from "./ProductMeta";
import { ProductActions } from "./ProductActions";

/** Works in both server and client trees (used by LoadMore too). */
export function ProductCard({ product, preload = false }: { product: Product; preload?: boolean }) {
  const t = useTranslations("common");
  const photo = product.photos[0];
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-lg bg-beige">
        {photo && (
          <Image
            src={photo.url}
            alt={product.category ? `${product.title} – ${product.category.name}` : product.title}
            fill
            preload={preload}
            fetchPriority={preload ? "high" : undefined}
            sizes="(min-width: 1280px) 270px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <span className="flex flex-wrap gap-1">
            <ConditionBadge condition={product.condition} />
            {product.inspected === false && <UncheckedBadge />}
          </span>
          {product.negotiable && (
            <span className="rounded-sm bg-white px-2 py-0.5 text-xs font-semibold text-ink">{t("negotiable")}</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        {product.category && <p className="text-xs font-medium uppercase tracking-wide text-muted">{product.category.name}</p>}
        <h3 lang={textLang(product.title)} className="ugc line-clamp-2 font-semibold leading-snug">
          <Link href={href} className="hover:underline">
            {product.title}
          </Link>
        </h3>
        <PriceTag product={product} />
        <ProductMeta product={product} />
        {product.freeDelivery && <p className="text-xs font-semibold text-ink">✓ {t("freeDelivery")}</p>}
        <div className="mt-auto pt-2">
          <ProductActions product={product} />
        </div>
      </div>
    </article>
  );
}
