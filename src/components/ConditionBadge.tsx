import { useTranslations } from "next-intl";
import type { ProductCondition } from "@/lib/api";
import { CONDITION_STYLES } from "@/lib/ui";

export function ConditionBadge({ condition, className = "" }: { condition: ProductCondition; className?: string }) {
  const t = useTranslations("conditions");
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold ${CONDITION_STYLES[condition]} ${className}`}>
      {t(condition)}
    </span>
  );
}
