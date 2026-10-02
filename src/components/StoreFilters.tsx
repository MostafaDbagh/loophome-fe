"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Category } from "@/lib/api";
import { pickFilters, toQuery } from "@/lib/storeFilters";
import { CONDITIONS } from "@/lib/ui";

type Props = {
  categories: Category[];
  activeCategory?: string;
  /** Active listing filters (q, condition, negotiable, inspected, sort), without the cursor. */
  current: Record<string, string | undefined>;
};

/**
 * The bar with the filters read from the URL. The store page is static (ISR), so it renders
 * <StoreFilters current={{}} /> as this one's Suspense fallback: the same bar, same height, so the
 * product grid never moves when this takes over (a bar streamed in late once cost CLS 0.104).
 */
export function StoreFiltersFromUrl(props: Omit<Props, "current">) {
  const current = { ...pickFilters(Object.fromEntries(useSearchParams())), cursor: undefined };
  return <StoreFilters key={toQuery(current)} {...props} current={current} />;
}

export function StoreFilters({ categories, activeCategory, current }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = new URLSearchParams(
    Object.entries(current).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
  );
  const [q, setQ] = useState(params.get("q") ?? "");

  const conditions = params.get("condition")?.split(",").filter(Boolean) ?? [];
  const inspected = params.get("inspected");
  const hasFilters = !!(params.get("q") || conditions.length || params.get("negotiable") || params.get("sort") || inspected);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("cursor");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const toggleCondition = (c: string) => {
    const list = conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c];
    update({ condition: list.join(",") || null });
  };

  // Keep condition/sort/negotiable filters, but never carry a search or a cursor into another listing.
  const categoryHref = (slug?: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("cursor");
    next.delete("q");
    const qs = next.toString();
    return `/store${slug ? `/${slug}` : ""}${qs ? `?${qs}` : ""}`;
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink/30"
    }`;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
        role="search"
        className="relative"
      >
        <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          name="q"
          aria-label={t("store.search")}
          placeholder={t("store.search")}
          className="field rounded-full! py-3! ps-12!"
        />
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={categoryHref()} className={chip(!activeCategory)}>
          {t("store.all")}
        </Link>
        {categories.map((c) => {
          const active = c.slug === activeCategory;
          return (
            <Link
              key={c.id}
              href={categoryHref(c.slug)}
              className={chip(active)}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {/* One row that scrolls sideways (never wraps): its height can't change when the web font
          loads, so the product grid below never jumps (CLS). */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <span className="shrink-0 text-sm font-semibold text-muted">{t("store.condition")}:</span>
        {CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={conditions.includes(c)}
            onClick={() => toggleCondition(c)}
            className={chip(conditions.includes(c))}
          >
            {t(`conditions.${c}`)}
          </button>
        ))}
        {(["true", "false"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={inspected === v}
            onClick={() => update({ inspected: inspected === v ? null : v })}
            className={chip(inspected === v)}
          >
            {t(v === "true" ? "store.checkedOnly" : "store.ownerListings")}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={!!params.get("negotiable")}
          onClick={() => update({ negotiable: params.get("negotiable") ? null : "true" })}
          className={chip(!!params.get("negotiable"))}
        >
          {t("store.negotiableOnly")}
        </button>

        <select
          aria-label={t("store.sort")}
          value={params.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="field ms-auto w-auto! shrink-0 rounded-full! py-1.5! text-sm font-semibold"
        >
          {(["newest", "price_asc", "price_desc"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`store.${s}`)}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.replace(pathname, { scroll: false });
            }}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink hover:underline"
          >
            <X className="size-4" />
            {t("store.clear")}
          </button>
        )}
      </div>
    </div>
  );
}
