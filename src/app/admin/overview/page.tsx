"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Money } from "@/components/Money";
import { adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { ServiceToggles } from "../ServiceToggles";
import { REQUESTS_CHANGED } from "../orderTabs";
import { overviewRange } from "./overviewRange";

type MoneyRow = { currency: string; revenue: number; cost?: number; profit?: number; items?: number; jobs?: number; moves?: number };
type Stats = {
  needsAttention: Record<string, number>;
  technicians: { completedInRange: number; revenue?: MoneyRow[] };
  moving: { completedInRange: number; revenue?: MoneyRow[] };
  pickupRentals?: { completedInRange: number; revenue?: MoneyRow[] };
  carRecoveries?: { completedInRange: number; revenue?: MoneyRow[] };
  listings: { active: number; pendingPayouts?: { currency: string; owners: number; amount: number }[] };
  inventory: { byStage: Record<string, number>; stockValue?: { currency: string; items: number; cost: number }[] };
  store: { activeProducts: number };
  sales: {
    itemsSold: number;
    byCurrency?: MoneyRow[];
    byCategory: { category: string; currency: string; items: number; revenue?: number; profit?: number }[];
  };
};

const RANGES = [7, 30, 90] as const;
type StatsResult = { key: string; data: Stats; failed: false } | { key: string; failed: true };

/** needsAttention keys that open a filtered order list when clicked. */
const LINKS: Record<string, string> = {
  newOrders: "/admin/orders?tab=furniture&state=pending",
  newSellRequests: "/admin/orders?tab=sell&state=pending",
  ownersToPay: "/admin/orders?tab=furniture&state=completed&payoutStatus=pending",
  newMoves: "/admin/orders?tab=movers&state=pending",
  movesThisWeek: "/admin/orders?tab=movers&state=pending",
  newTechnicianRequests: "/admin/orders?tab=technicians&state=pending",
  urgentTechnicianRequests: "/admin/orders?tab=technicians&state=pending",
  technicianVisitsToday: "/admin/orders?tab=technicians&state=pending",
  newPickupRentals: "/admin/orders?tab=pickup&state=pending",
  newCarRecoveries: "/admin/orders?tab=recovery&state=pending",
};

export default function AdminOverviewPage() {
  const { t, lang, admin } = useAdmin();
  const canSeeMoney = admin.role === "owner";
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<StatsResult | null>(null);
  const { from, to } = overviewRange(days);
  const requestKey = `${lang}:${days}:${from}:${to}:${version}`;
  // Never show a previous period or language's figures while its replacement loads or fails.
  const current = result?.key === requestKey ? result : null;
  const stats = current && !current.failed ? current.data : null;
  const error = current?.failed === true;
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const qs = new URLSearchParams({ from, to });
    adminFetch<Stats>(`/admin/stats?${qs}`, { signal: controller.signal, cache: "no-store" })
      .then((data) => alive && setResult({ key: requestKey, data, failed: false }))
      .catch(() => alive && setResult({ key: requestKey, failed: true }));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [requestKey, from, to]);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const visible = () => { if (document.visibilityState === "visible") bump(); };
    // Keep a dashboard left open overnight on the correct UAE reporting day.
    const nextMidnight = Date.parse(`${to}T00:00:00+04:00`) + 86_400_000;
    const timer = window.setTimeout(bump, Math.max(1_000, nextMidnight - Date.now() + 50));
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener(REQUESTS_CHANGED, bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener(REQUESTS_CHANGED, bump);
    };
  }, [to]);

  const money = (n: number, currency = "AED") => <Money amount={n} currency={currency} locale={lang} maximumFractionDigits={2} />;
  const label = (key: string) => (t as unknown as Record<string, string>)[key] ?? key;
  const date = (day: string) => new Intl.DateTimeFormat(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(`${day}T12:00:00+04:00`));

  return (
    <div className="space-y-8" aria-busy={!current}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t.overview}</h1>
          <p className="mt-2 text-sm text-muted">{t.reportingPeriod}: {current ? <bdi>{date(from)} – {date(to)}</bdi> : t.loading} · {t.dubaiTime}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label={t.reportingPeriod} className="flex gap-1 rounded-full bg-beige p-1">
            {RANGES.map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={days === d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${days === d ? "bg-surface shadow" : "text-muted"}`}
              >
                {t[`days${d}` as "days7"]}
              </button>
            ))}
          </div>
          <button type="button" onClick={refresh} disabled={!current} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold hover:bg-beige disabled:opacity-50">
            <RefreshCw aria-hidden className={`size-4 ${!current ? "animate-spin" : ""}`} />{t.refreshStats}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-red-700"><p>{t.error}</p><button type="button" onClick={refresh} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold">{t.retry}</button></div>}
      {!stats && !error && <p role="status" className="p-6 text-center text-muted">{t.loading}</p>}

      {stats && (
        <>
          <section>
            <h2 className="mb-3 text-lg font-bold">{t.needsAttention}</h2>
            {Object.values(stats.needsAttention).every((n) => !n) ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t.nothing}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(stats.needsAttention)
                  .filter(([, n]) => n > 0)
                  .map(([key, n]) => {
                    const urgent = key.startsWith("urgent") || key.includes("Over48h");
                    const body = (
                      <>
                        <span className={`text-3xl font-extrabold ${urgent ? "text-red-700" : ""}`}>{n}</span>
                        <span className="text-sm font-semibold text-ink/80">{label(key)}</span>
                      </>
                    );
                    const cls = `flex flex-col gap-1 rounded-xl border p-4 ${urgent ? "border-red-200 bg-red-50" : "border-border bg-surface"}`;
                    return (
                      <li key={key}>
                        {LINKS[key] ? (
                          <Link href={LINKS[key]} className={`${cls} transition hover:border-ink/40`}>
                            {body}
                          </Link>
                        ) : (
                          <div className={cls}>{body}</div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">{canSeeMoney ? t.income : t.jobs}</h2>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-muted">{t.storeSales}</p>
                {canSeeMoney && <p className="mt-1 text-xs text-muted">{t.itemSalesNote}</p>}
                {canSeeMoney && (stats.sales.byCurrency?.length ? (
                  stats.sales.byCurrency.map((r) => (
                    <dl key={r.currency} className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-2xl font-extrabold">
                        <dt className="sr-only">{t.revenue}</dt>
                        <dd>{money(r.revenue, r.currency)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted">{t.cost}</dt>
                        <dd>{money(r.cost ?? 0, r.currency)}</dd>
                      </div>
                      <div className="flex justify-between font-bold">
                        <dt>{t.profit}</dt>
                        <dd>{money(r.profit ?? 0, r.currency)}</dd>
                      </div>
                    </dl>
                  ))
                ) : (
                  <p className="mt-2 text-2xl font-extrabold">{money(0)}</p>
                ))}
                <p className="mt-3 border-t border-border pt-2 text-sm text-muted">{t.itemsSold}: <span className="font-semibold text-ink">{stats.sales.itemsSold}</span></p>
              </div>
              {(
                [
                  [t.movingIncome, stats.moving],
                  [t.technicianIncome, stats.technicians],
                  // The newer services only once they have completed jobs in the range.
                  ...(stats.pickupRentals?.completedInRange ? [[t.pickupIncome, stats.pickupRentals] as const] : []),
                  ...(stats.carRecoveries?.completedInRange ? [[t.recoveryIncome, stats.carRecoveries] as const] : []),
                ] as const
              ).map(([title, block]) => (
                <div key={title} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm font-semibold text-muted">{title}</p>
                  {canSeeMoney && <p className="mt-2 text-2xl font-extrabold">
                    {block.revenue?.length ? block.revenue.map((r) => <span key={r.currency}>{money(r.revenue, r.currency)}</span>) : money(0)}
                  </p>}
                  <p className="mt-1 text-sm text-muted">
                    {t.jobs}: {block.completedInRange}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.salesByCategory}</h2>
              {stats.sales.byCategory.length ? (
                <table className="w-full overflow-hidden rounded-xl border border-border bg-surface text-sm">
                  <thead className="bg-beige text-start">
                    <tr>
                      <th className="p-3 text-start">{t.category}</th>
                      <th className="p-3 text-start">{t.items}</th>
                      {canSeeMoney && <th className="p-3 text-start">{t.revenue}</th>}
                      {canSeeMoney && <th className="p-3 text-start">{t.profit}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.sales.byCategory.map((c) => (
                      <tr key={`${c.category}-${c.currency}`}>
                        <td className="p-3">{c.category}</td>
                        <td className="p-3">{c.items}</td>
                        {canSeeMoney && <td className="p-3">{money(c.revenue ?? 0, c.currency)}</td>}
                        {canSeeMoney && <td className="p-3 font-semibold">{money(c.profit ?? 0, c.currency)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t.nothing}</p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">{t.stock}</h2>
              <p className="mb-3 text-xs text-muted">{t.stockSnapshotNote}</p>
              <div className="space-y-3 rounded-xl border border-border bg-surface p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">{t.activeProducts}</span>
                  <span className="font-bold">{stats.store.activeProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t.activeListings}</span>
                  <span className="font-bold">{stats.listings.active}</span>
                </div>
                {canSeeMoney && stats.inventory.stockValue?.map((v) => (
                  <div key={v.currency} className="flex justify-between">
                    <span className="text-muted">
                      {t.stockValue} · {v.items} {t.items}
                    </span>
                    <span className="font-bold">{money(v.cost, v.currency)}</span>
                  </div>
                ))}
                <ul className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {Object.entries(stats.inventory.byStage).map(([stage, n]) => (
                    <li key={stage} className="rounded-full bg-beige px-3 py-1 text-xs font-semibold">
                      {t.stages[stage] ?? stage}: {n}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}

      <details className="rounded-xl border border-border bg-surface">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">{t.serviceSwitch.title}</summary>
        <ServiceToggles />
      </details>
    </div>
  );
}
