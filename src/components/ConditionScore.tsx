import { useTranslations } from "next-intl";

/** The team's score after inspection: "Condition: 8/10" with a small 10-step meter. */
export function ConditionScore({ score, className = "" }: { score: number; className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      role="img"
      aria-label={t("conditionScoreLabel", { score })}
      className={`inline-flex items-center gap-1.5 rounded-sm bg-beige px-2 py-0.5 text-xs font-semibold text-ink ${className}`}
    >
      <span aria-hidden>{t("conditionScore", { score })}</span>
      <span aria-hidden dir="ltr" className="flex gap-px">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2 w-1 rounded-[1px] ${i < score ? "bg-ink" : "bg-ink/20"}`} />
        ))}
      </span>
    </span>
  );
}
