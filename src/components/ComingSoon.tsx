import { MessageCircle, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/seo/config";

/** Small "Soon" pill next to a service the owner switched off (it stays visible, never hidden). */
export function SoonTag({ className = "inline-block px-1.5 text-[10px] leading-4" }: { className?: string }) {
  const t = useTranslations("soon");
  // Callers set display, size and position; no letter-spacing (it would break Arabic joining).
  return <span className={`rounded-sm bg-sand font-bold uppercase text-ink ${className}`}>{t("tag")}</span>;
}

/** Page of a switched-off service: its title and intro, then "coming soon" with what people can do now. */
export function ComingSoonPage({ title, intro, crumbs }: { title: string; intro: string; crumbs: { name: string; path: string }[] }) {
  const t = useTranslations("soon");
  return (
    <div className="mx-auto max-w-3xl px-4">
      <Breadcrumbs items={crumbs} />
      <header className="pb-8 pt-6">
        <SoonTag className="mb-3 inline-block px-1.5 text-[10px] leading-4" />
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/80">{intro}</p>
      </header>
      <section className="rounded-xl bg-beige p-6 sm:p-8">
        <h2 className="text-xl font-extrabold">{t("title")}</h2>
        <p className="mt-2 max-w-xl text-ink/80">{t("text")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={routes.sell} className="btn-cta">
            <Tag aria-hidden className="size-5" />
            {t("sell")}
          </Link>
          <Link href={routes.contact} className="btn-ghost">
            <MessageCircle className="size-5" />
            {t("contact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
