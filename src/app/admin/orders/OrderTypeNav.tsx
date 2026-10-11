"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "../AdminShell";
import { COMPLETED_ORDER_TABS, ORDER_TABS, type OrderTab } from "../orderTabs";

/** One service navigation shared by the finished-work archive and dispute queue. */
export function OrderTypeNav({ tab, view }: { tab: OrderTab | "all"; view: "completed" | "disputes" }) {
  const { t } = useAdmin();
  const params = useSearchParams();
  const tabs: (OrderTab | "all")[] = ["all", ...(view === "completed" ? COMPLETED_ORDER_TABS : Object.keys(ORDER_TABS) as OrderTab[])];
  const labels = { all: t.allServices, sell: t.sell, furniture: t.furniture, movers: t.movers, technicians: t.technicians, pickup: t.pickupRentals, recovery: t.carRecoveries };
  return <nav aria-label={t.services} className="flex flex-wrap gap-1 rounded-xl bg-beige p-1">
    {tabs.map((value) => {
      const next = new URLSearchParams(params.toString());
      next.set("tab", value);
      next.delete("page");
      next.delete("q");
      if (value !== "all" && value !== "furniture") next.delete("payoutStatus");
      return <Link key={value} href={`/admin/${view === "completed" ? "completed-orders" : "disputes"}?${next}`} aria-current={value === tab ? "page" : undefined}
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${value === tab ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
        {labels[value]}
      </Link>;
    })}
  </nav>;
}
