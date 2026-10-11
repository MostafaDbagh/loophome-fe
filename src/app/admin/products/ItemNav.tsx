"use client";

import Link from "next/link";
import { useAdmin } from "../AdminShell";
import { ITEM_BUCKETS, ITEM_BUCKET_PATHS, type ItemBucket } from "./itemBuckets";

export function ItemNav({ current }: { current: ItemBucket | null }) {
  const { t } = useAdmin();
  const labels = { ...t.itemWorkflow.labels, pending: t.itemWorkflow.allItems, buyer: t.furniture, sold: t.completedOrders, disputes: t.disputes };
  return <nav aria-label={t.itemWorkflow.nav} className="flex flex-wrap gap-1 rounded-xl bg-beige p-1">
    {ITEM_BUCKETS.map((bucket) => <Link key={bucket} href={ITEM_BUCKET_PATHS[bucket]} aria-current={current === bucket ? "page" : undefined}
      className={`rounded-lg px-4 py-2 text-sm font-semibold ${current === bucket ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}>
      {labels[bucket]}
    </Link>)}
  </nav>;
}
