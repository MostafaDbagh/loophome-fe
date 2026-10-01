import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/** An item LoopHome bought and inspected itself (the counterpart of UncheckedBadge). */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm bg-white px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-ink/20 ${className}`}>
      <BadgeCheck aria-hidden className="size-3.5" />
      {t("verified")}
    </span>
  );
}
