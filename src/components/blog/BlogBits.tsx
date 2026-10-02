import { BookOpen, ShoppingBag, Tag, Truck, Wrench, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogCard as Card, BlogCategory } from "@/lib/api";
import { routes } from "@/lib/seo/config";

export const BLOG_ICONS: Record<BlogCategory, LucideIcon> = {
  selling: Tag,
  buying: ShoppingBag,
  moving: Truck,
  "home-services": Wrench,
  guides: BookOpen,
};

/** Where each category's call-to-action points. */
export const BLOG_CTA: Record<BlogCategory, string> = {
  selling: routes.sell,
  buying: routes.store,
  moving: routes.moving,
  "home-services": routes.technician,
  guides: routes.store,
};

/** Cover photo, or a calm fallback panel with the category icon when there's no image. */
export function BlogCover({ card, priority = false, large = false }: { card: Card; priority?: boolean; large?: boolean }) {
  const t = useTranslations("blog.categories");
  const Icon = BLOG_ICONS[card.category] ?? BookOpen;
  if (card.cover) {
    return (
      <Image
        src={large ? card.cover.url : card.cover.thumbUrl || card.cover.url}
        alt={card.title}
        fill
        preload={priority}
        fetchPriority={priority ? "high" : undefined}
        sizes={large ? "(min-width: 1024px) 896px, 100vw" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"}
        className="object-cover"
      />
    );
  }
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-beige text-ink">
      <Icon className={large ? "size-16" : "size-10"} strokeWidth={1.25} />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">{t(card.category)}</span>
    </div>
  );
}

export function BlogCardView({ card, priority = false }: { card: Card; priority?: boolean }) {
  const t = useTranslations("blog");
  const format = useFormatter();
  return (
    <article className="group flex flex-col">
      {/* Duplicate of the title link below: hidden from keyboard and screen readers, so it needs no name. */}
      <Link href={routes.post(card.slug)} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] overflow-hidden rounded-lg">
        <BlogCover card={card} priority={priority} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t(`categories.${card.category}`)} · {t("readingTime", { n: card.readingMinutes })}
        </p>
        <h3 className="ugc text-lg font-bold leading-snug">
          <Link href={routes.post(card.slug)} className="hover:underline">
            {card.title}
          </Link>
        </h3>
        <p className="ugc line-clamp-3 text-sm text-ink/75">{card.excerpt}</p>
        <time dateTime={card.publishedAt} className="mt-auto text-xs text-muted">
          {format.dateTime(new Date(card.publishedAt), { day: "numeric", month: "long", year: "numeric" })}
        </time>
      </div>
    </article>
  );
}
