import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCardView, BlogFilters } from "@/components/blog/BlogBits";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlog, getSettings, sellToUsOn, type BlogCategory } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/listingParams";
import { BLOG_CATEGORIES, routes } from "@/lib/seo/config";
import { breadcrumbSchema, collectionSchema, JsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

// Static, refreshed at most every 5 minutes (ISR). Each category is its own indexable page, with its
// own canonical and hreflang (the old /blog?category= URLs redirect here). Any other category is a 404.
// Not `dynamicParams = false`: with it, Next 16 answers 404 for every category once an admin change
// expires the API cache tag (/api/revalidate), until the next deploy.
export const revalidate = 300;

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({ category }));
}

const isCategory = (value: string): value is BlogCategory => (BLOG_CATEGORIES as readonly string[]).includes(value);

/** Every post in the category, so there are no page links. Same request in metadata and page. */
const postsIn = (locale: Locale, category: BlogCategory) => getBlog(locale, { category, limit: BLOG_PAGE_SIZE });

/** A link inside a translated sentence (t.rich). */
function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold underline underline-offset-2">
      {children}
    </Link>
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/category/[category]">): Promise<Metadata> {
  const { locale: lang, category } = await params;
  const locale = lang as Locale;
  if (!isCategory(category)) return {};
  const t = await getTranslations({ locale, namespace: "blog" });
  // An empty category is a thin page: kept out of the index (and the sitemap) until it has posts.
  const { total } = await postsIn(locale, category);
  return pageMetadata({
    locale,
    path: routes.blogCategory(category),
    title: t(`categoryPages.${category}.title`),
    description: t(`categoryPages.${category}.description`),
    noindex: total === 0,
  });
}

export default async function BlogCategoryPage({ params }: PageProps<"/[locale]/blog/category/[category]">) {
  const { locale: lang, category } = await params;
  const locale = lang as Locale;
  if (!isCategory(category)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  // Its own namespace, not under "blog": the blog index sends the whole "blog" namespace to the browser.
  const ta = await getTranslations({ locale, namespace: `blogCategoryAbout.${category}` });
  const [{ items }, settings] = await Promise.all([postsIn(locale, category), getSettings(locale)]);
  // While buying is paused, the paragraph that offers it (p2Buying) is left out and selling uses p1List.
  const buying = sellToUsOn(settings);
  const path = routes.blogCategory(category);
  const h1 = t(`categoryPages.${category}.h1`);
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
    { name: t(`categories.${category}`), path },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd
        data={[
          ...collectionSchema(locale, { name: h1, description: t(`categoryPages.${category}.description`), path }, []),
          breadcrumbSchema(locale, crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{h1}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t(`categoryPages.${category}.intro`)}</p>
      </header>

      <BlogFilters category={category} />

      <section className="mt-8" aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="sr-only">
          {t("listHeading")}
        </h2>
        {items.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((card, i) => (
              <BlogCardView key={card.slug} card={card} priority={i === 0} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
        )}
      </section>

      {/* What the category's guides cover: the page's own text, not only post cards. It describes the
          published guides, so an empty category leaves it out. */}
      {items.length > 0 && (
        <section className="mt-16 max-w-3xl" aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-2xl font-extrabold">
            {ta("title")}
          </h2>
          {[!buying && ta.has("p1List") ? "p1List" : "p1", ...(ta.has("p2") ? ["p2"] : []), ...(buying && ta.has("p2Buying") ? ["p2Buying"] : [])].map((key) => (
            <p key={key} className="mt-4 leading-relaxed text-ink/80">
              {ta.rich(key, {
                sell: (chunks) => <InlineLink href={routes.sell}>{chunks}</InlineLink>,
                appliances: (chunks) => <InlineLink href={routes.sellAppliances}>{chunks}</InlineLink>,
                movingOut: (chunks) => <InlineLink href={routes.sellMovingOut}>{chunks}</InlineLink>,
                grades: (chunks) => <InlineLink href={routes.conditionGrades}>{chunks}</InlineLink>,
                areas: (chunks) => <InlineLink href={routes.areas}>{chunks}</InlineLink>,
              })}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
