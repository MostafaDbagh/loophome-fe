import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/api";
import { CATEGORY_ICONS } from "./icons";

export function CategoryCards({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS.package;
        return (
          <Link
            key={c.id}
            href={`/store/${c.slug}`}
            className="group flex flex-col justify-between gap-6 rounded-lg bg-beige p-4 transition hover:bg-beige-dark"
          >
            <Icon className="size-8 text-ink" strokeWidth={1.5} />
            <span className="flex items-end justify-between gap-2 text-sm font-semibold leading-tight">
              {c.name}
              <ArrowRight className="size-4 shrink-0 opacity-0 transition group-hover:opacity-100 rtl:rotate-180" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
