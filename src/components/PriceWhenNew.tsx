import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/api";
import { whenNewSaving } from "@/lib/format";
import { Money } from "./Money";

/**
 * Item page: the admin's estimate of the same item new next to our asking price, and the saving.
 * Only these two public prices; what LoopHome paid for the item never reaches customers.
 */
export function PriceWhenNew({ product }: { product: Product }) {
  const t = useTranslations("product");
  const locale = useLocale();
  // The API only sends it when there's a real saving; a sold item has nothing to save.
  const saving = product.status === "sold" ? null : whenNewSaving(product);
  if (!saving) return null;
  const money = (amount: number) => <Money amount={amount} currency={product.currency} locale={locale} />;

  return (
    <div className="rounded-xl bg-beige p-4 text-sm">
      <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5">
        <dt className="text-ink/70">{t("whenNew")}</dt>
        <dd className="text-end font-semibold text-ink/80">{money(saving.whenNew)}</dd>
        <dt className="text-ink/70">{t("ourPrice")}</dt>
        <dd className="text-end text-base font-extrabold">{money(product.price)}</dd>
      </dl>
      <p className="mt-3 border-t border-ink/10 pt-3 font-bold">
        {t.rich("youSave", { amount: () => money(saving.amount), percent: saving.percent })}
      </p>
      <p className="mt-1 text-xs text-muted">{t("whenNewNote")}</p>
    </div>
  );
}
