import { BookOpen, Search, ShoppingBag, Tag, Truck, Wrench, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogCard as Card, BlogCategory } from "@/lib/api";
import { BLOG_CATEGORIES, routes } from "@/lib/seo/config";

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

/**
 * Category links (each category has its own page) and the article search, above both blog listings.
 * `category`: the category page being shown; none on the blog index.
 */
export function BlogFilters({ category, q }: { category?: BlogCategory; q?: string }) {
  const t = useTranslations("blog");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink/40"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label={tn("blog")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={routes.blog} aria-current={!category && !q ? "page" : undefined} className={chip(!category)}>
          {t("all")}
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link key={c} href={routes.blogCategory(c)} aria-current={c === category ? "page" : undefined} className={chip(c === category)}>
            {t(`categories.${c}`)}
          </Link>
        ))}
      </nav>
      {/* Plain GET form: works without JS. It searches every category. */}
      <form key={q ?? ""} role="search" action={`/${locale}${routes.blog}`} className="relative ms-auto w-full sm:w-72">
        <Search aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} aria-label={t("search")} placeholder={t("search")} className="field rounded-full! py-2! ps-10!" />
      </form>
    </div>
  );
}
