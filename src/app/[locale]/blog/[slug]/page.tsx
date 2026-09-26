import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShareButton } from "@/components/ShareButton";
import { BLOG_CTA, BlogCardView, BlogCover } from "@/components/blog/BlogBits";
import { Markdown } from "@/components/blog/Markdown";
import { BlogViewBeacon } from "@/components/blog/BlogViewBeacon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBlogPost } from "@/lib/api";
import { textLang } from "@/lib/format";
import { routes, SITE_NAME } from "@/lib/seo/config";
import { blogPostingSchema, breadcrumbSchema, faqSchema, JsonLd } from "@/lib/seo/jsonld";
import { notFoundMetadata, ogImage, pageMetadata, siteUrl } from "@/lib/seo/metadata";

export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

const load = cache((locale: Locale, slug: string) => getBlogPost(locale, slug));

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const post = await load(locale, slug);
  if (!post) return notFoundMetadata((await getTranslations({ locale, namespace: "notFound" }))("title"));
  return pageMetadata({
    locale,
    path: routes.post(post.slug),
    title: post.title,
    description: post.excerpt,
    type: "article",
    images: post.cover ? [{ ...ogImage(post.cover.url), alt: post.title }] : undefined,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: (await getTranslations({ locale, namespace: "blog" }))(`categories.${post.category}`),
      tags: locale === "en" ? post.tags : undefined,
      authors: [SITE_NAME],
    },
  });
}

export default async function BlogPostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  setRequestLocale(locale);
  const post = await load(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const tm = await getTranslations({ locale, namespace: "meta.breadcrumb" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const format = await getFormatter({ locale });
  const date = (v: string) => format.dateTime(new Date(v), { day: "numeric", month: "long", year: "numeric" });
  const crumbs = [
    { name: tm("home"), path: routes.home },
    { name: tn("blog"), path: routes.blog },
    { name: post.title, path: routes.post(post.slug) },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4">
      <JsonLd
        data={[
          blogPostingSchema(locale, post),
          breadcrumbSchema(locale, crumbs),
          ...(post.faq.length ? [faqSchema(post.faq.map((f) => ({ q: f.question, a: f.answer })))] : []),
        ]}
      />
      <BlogViewBeacon slug={post.slug} />
      <Breadcrumbs items={crumbs} />

      <header className="pb-6 pt-6">
        <Link href={`${routes.blog}?category=${post.category}`} className="text-sm font-semibold uppercase tracking-wide text-muted hover:underline">
          {t(`categories.${post.category}`)}
        </Link>
        <h1 lang={textLang(post.title)} className="ugc mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          {post.author && <span>{t("by", { author: post.author })}</span>}
          <time dateTime={post.publishedAt}>{t("published", { date: date(post.publishedAt) })}</time>
          {post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) && (
            <time dateTime={post.updatedAt}>{t("updated", { date: date(post.updatedAt) })}</time>
          )}
          <span>{t("readingTime", { n: post.readingMinutes })}</span>
        </p>
        <div className="mt-4">
          <ShareButton url={siteUrl(locale, routes.post(post.slug))} title={post.title} kind="article" />
        </div>
      </header>

      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
        <BlogCover card={post} priority large />
      </div>

      <Markdown content={post.content} />

      <aside className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl bg-beige p-6 sm:flex-row sm:items-center">
        <p className="font-semibold">{t(`cta.${post.category}.text`)}</p>
        <Link href={BLOG_CTA[post.category]} className="btn-cta shrink-0">
          {t(`cta.${post.category}.button`)}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </aside>

      {post.related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-extrabold">{t("related")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {post.related.slice(0, 3).map((card) => (
              <BlogCardView key={card.slug} card={card} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10">
        <Link href={routes.blog} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          <ArrowRight aria-hidden className="size-4 ltr:rotate-180" />
          {t("back")}
        </Link>
      </p>
    </article>
  );
}
