import { ShieldQuestion } from "lucide-react";
import { useTranslations } from "next-intl";

/** Owner listing that HomeLoop hasn't inspected. */
export function UncheckedBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm bg-white px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-ink/20 ${className}`}>
      <ShieldQuestion aria-hidden className="size-3.5" />
      {t("unchecked")}
    </span>
  );
}
