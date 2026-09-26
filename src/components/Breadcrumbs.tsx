import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { textLang } from "@/lib/format";

/** Visible breadcrumb trail; the same items feed the BreadcrumbList JSON-LD. */
export async function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const t = await getTranslations("common");
  return (
    <nav aria-label={t("breadcrumb")} className="pt-6 text-sm text-muted">
      <ol className="flex min-h-5 flex-nowrap items-center gap-1 overflow-hidden">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path || "home"} className={`inline-flex items-center gap-1 ${last ? "min-w-0" : "shrink-0"}`}>
              {last ? (
                <span aria-current="page" lang={textLang(c.name)} className="ugc line-clamp-1 font-semibold text-foreground">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.path || "/"} className="hover:underline">
                    {c.name}
                  </Link>
                  <ChevronLeft aria-hidden className="size-4 ltr:rotate-180" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
