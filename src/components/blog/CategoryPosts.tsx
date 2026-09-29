import { getTranslations } from "next-intl/server";
import { BlogCardView } from "@/components/blog/BlogBits";
import type { Locale } from "@/i18n/routing";
import { getBlog, type BlogCategory } from "@/lib/api";

/** Newest posts in one category, so each service page links to its guides. */
export async function CategoryPosts({ locale, category }: { locale: Locale; category: BlogCategory }) {
  const { items } = await getBlog(locale, { category, limit: 3 });
  if (!items.length) return null;
  const t = await getTranslations({ locale, namespace: "blog" });
  return (
    <section className="mt-14">
      <h2 className="mb-5 text-xl font-extrabold">{t("latest")}</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {items.map((card) => (
          <BlogCardView key={card.slug} card={card} />
        ))}
      </div>
    </section>
  );
}
