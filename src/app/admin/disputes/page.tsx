"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminApiError, adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill } from "../i18n";
import { Pagination } from "../Pagination";
import { isTab, REQUESTS_CHANGED, sourceTypeForTab, type OrderTab } from "../orderTabs";
import { OrderTypeNav } from "../orders/OrderTypeNav";
import { ItemNav } from "../products/ItemNav";
import { disputeSourceHref } from "../orders/orderFlow";
import { normalizeOrderPage, normalizeOrderSearch } from "../orders/orderList";
import { fmtDate } from "../orders/RequestPanel";
import type { Dispute } from "./types";

type PageData = { items: Dispute[]; total: number; page: number; pages: number };

export default function DisputesPage() {
  return <Suspense fallback={<Loading />}><Disputes /></Suspense>;
}
function Loading() {
  const { t } = useAdmin();
  return <p role="status" className="p-6 text-center text-muted">{t.loading}</p>;
}
function Disputes() {
  const { t, lang } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const tab: OrderTab | "all" = isTab(params.get("tab")) ? params.get("tab") as OrderTab : "all";
  const status = params.get("status") === "resolved" ? "resolved" : params.get("status") === "all" ? "all" : "open";
  const q = normalizeOrderSearch(params.get("q"));
  const page = normalizeOrderPage(params.get("page"));
  const [search, setSearch] = useState(q);
  const [shownQ, setShownQ] = useState(q);
  const [version, setVersion] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ key: string; id: string | null } | null>(null);
  const [result, setResult] = useState<{ key: string; data?: PageData; error?: string } | null>(null);
  if (shownQ !== q) { setShownQ(q); setSearch(q); }
  const filterKey = JSON.stringify([tab, status, q, page]);
  const qs = new URLSearchParams({ page: String(page), limit: "20" });
  if (status !== "all") qs.set("status", status);
  if (tab !== "all") qs.set("sourceType", sourceTypeForTab(tab));
  if (q) qs.set("q", q);
  const fetchPath = `/admin/disputes?${qs}`;
  const requestKey = `${lang}:${version}:${fetchPath}`;
  const current = result?.key === requestKey ? result : null;
  const data = current?.data;
  function href(changes: Record<string, string | null>) {
    const next = new URLSearchParams({ tab, status });
    if (q) next.set("q", q);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    return `/admin/disputes?${next}`;
  }
  const lastPage = Math.max(1, data?.pages ?? page);
  const recovery = data && page > lastPage ? href({ page: lastPage > 1 ? String(lastPage) : null })
    : (params.has("page") && params.get("page") !== String(page)) || (params.has("q") && params.get("q") !== q)
      ? href({ page: page > 1 ? String(page) : null }) : null;
  useEffect(() => { if (recovery) router.replace(recovery, { scroll: false }); }, [recovery, router]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    adminFetch<PageData>(fetchPath, { signal: controller.signal })
      .then((data) => { if (alive) setResult({ key: requestKey, data }); })
      .catch((err) => { if (alive) setResult({ key: requestKey, error: adminErrorText(err, t.error) }); });
    return () => { alive = false; controller.abort(); };
  }, [fetchPath, requestKey, t.error]);
  const defaultOpenId = data?.items.find((row) => q && [row.number, row.source.number].some((number) => number.toLowerCase() === q.toLowerCase()))?.id
    ?? (q && data?.items.length === 1 ? data.items[0].id : null);
  const openId = selected?.key === filterKey ? selected.id : defaultOpenId;
  if (data && selected?.key !== filterKey) setSelected({ key: filterKey, id: defaultOpenId });
  function changed(message: string) {
    setVersion((n) => n + 1);
    setFlash(message);
    window.dispatchEvent(new Event(REQUESTS_CHANGED));
  }
  const labels = { open: t.disputeOpen, resolved: t.disputeResolved, all: t.disputeAll };
  return <div className="space-y-5">
    <header className="space-y-2"><h1 className="text-2xl font-extrabold">{t.disputes}</h1><p className="max-w-3xl text-sm leading-6 text-muted">{t.disputesIntro}</p></header>
    <ItemNav current="disputes" />
    <OrderTypeNav tab={tab} view="disputes" />
    <nav aria-label={t.disputes} className="flex flex-wrap gap-2">
      {(["open", "resolved", "all"] as const).map((value) => <Link key={value} href={href({ status: value })} aria-current={status === value ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${status === value ? "border-ink bg-ink text-white" : "border-border hover:bg-beige"}`}>{labels[value]}</Link>)}
    </nav>
    <form className="relative w-full sm:w-96" onSubmit={(e) => { e.preventDefault(); router.replace(href({ q: normalizeOrderSearch(search) || null })); }}>
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input aria-label={t.search} placeholder={t.search} className="field py-2! ps-9!" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
    </form>
    {flash && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{flash}</p>}
    {current?.error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700"><p>{current.error}</p><button type="button" className="mt-2 font-semibold underline" onClick={() => setVersion((n) => n + 1)}>{t.retry}</button></div>
      : !data || recovery ? <Loading />
      : data.items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">{t.noDisputes}</p>
      : <><p className="text-sm text-muted">{labels[status]} · {fill(t.total, { n: data.total })}</p><ul className="space-y-3">
        {data.items.map((row) => <DisputeCard key={row.id} dispute={row} open={openId === row.id} onToggle={() => setSelected({ key: filterKey, id: openId === row.id ? null : row.id })} onChanged={changed} />)}
      </ul><Pagination page={data.page} pages={Math.max(1, data.pages)} onPage={(next) => router.replace(href({ page: String(next) }))} t={t} /></>}
  </div>;
}
function DisputeCard({ dispute, open, onToggle, onChanged }: { dispute: Dispute; open: boolean; onToggle: () => void; onChanged: (message: string) => void }) {
  const { t } = useAdmin();
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceHref = disputeSourceHref(dispute.source);
  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    if (!resolution.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await adminFetch<Dispute>(`/admin/disputes/${dispute.id}/resolve`, { method: "POST", body: JSON.stringify({ resolutionNote: resolution.trim() }) });
      onChanged(t.disputeResolvedSaved);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) onChanged(t.disputeAlreadyResolved);
      else setError(adminErrorText(err, t.error));
    }
    finally { setBusy(false); }
  }
  return <li className="overflow-hidden rounded-xl border border-border bg-surface">
    <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-start">
      <ChevronDown aria-hidden className={`mt-1 size-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><bdi className="font-mono text-sm font-bold">{dispute.number}</bdi><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dispute.status === "open" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>{dispute.status === "open" ? t.disputeOpen : t.disputeResolved}</span><span className="text-xs text-muted">{t[`${dispute.source.tab}Title` as "furnitureTitle"]}</span></span>
        <span className="mt-1 block break-words text-sm"><bdi>{dispute.source.number}</bdi> · <bdi>{dispute.source.title}</bdi> · <bdi>{dispute.source.name}</bdi></span></span>
      <span dir="ltr" className="shrink-0 text-xs text-muted max-sm:hidden">{fmtDate(dispute.createdAt, true)}</span>
    </button>
    {open && <div className="space-y-5 border-t border-border p-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted">{t.disputeSource}</dt><dd className="mt-1 font-semibold"><bdi>{dispute.source.number}</bdi> · {t.status[dispute.source.status] ?? dispute.source.status}</dd></div><div><dt className="text-muted">{t.disputeCreatedBy}</dt><dd className="mt-1"><bdi>{dispute.createdBy.name}</bdi> · <span dir="ltr">{fmtDate(dispute.createdAt, true)}</span></dd></div></dl>
      {sourceHref ? <Link className="inline-block text-sm font-semibold underline underline-offset-4" href={sourceHref}>{t.viewSource}</Link> : <p className="text-sm text-muted">{t.sourceMissing}</p>}
      <section><h3 className="text-sm font-bold">{t.disputeReason}</h3><p className="ugc mt-2 whitespace-pre-line break-words text-sm">{dispute.reason}</p></section>
      {dispute.status === "open" ? <form onSubmit={resolve} className="space-y-3 rounded-xl bg-beige/50 p-4">
        <label className="block text-sm font-semibold">{t.resolutionNote}<textarea required maxLength={2000} className="field mt-2 min-h-24" placeholder={t.disputeResolutionHint} value={resolution} onChange={(e) => setResolution(e.target.value)} /></label>
        <p className="text-xs leading-5 text-muted">{t.disputeNoFinancialAction}</p>
        <button disabled={busy || !resolution.trim()} className="btn-primary text-sm disabled:opacity-50">{busy ? t.saving : t.resolveDispute}</button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </form> : <section className="rounded-xl bg-green-50 p-4"><h3 className="text-sm font-bold text-green-800">{t.disputeResolved}</h3><p className="ugc mt-2 whitespace-pre-line break-words text-sm">{dispute.resolutionNote}</p></section>}
      <section><h3 className="mb-3 text-sm font-bold">{t.disputeHistory}</h3><ol className="space-y-3 border-s-2 border-border ps-4">{dispute.history.map((entry, index) => <li key={`${entry.at}:${index}`} className="text-sm"><p className="font-semibold">{entry.status === "open" ? t.disputeOpen : t.disputeResolved}</p><p className="ugc whitespace-pre-line break-words">{entry.note}</p><p className="mt-1 text-xs text-muted"><bdi>{entry.by.name}</bdi> · <span dir="ltr">{fmtDate(entry.at, true)}</span></p></li>)}</ol></section>
    </div>}
  </li>;
}
