"use client";

import { ChevronDown, Phone, Search, Siren, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import { adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill, type AdminText } from "../i18n";
import { Pagination } from "../Pagination";
import { isState, isTab, ORDER_STATES, ORDER_TABS, REQUESTS_CHANGED, type OrderState, type OrderTab } from "../orderTabs";
import { fmtDate, Photos, RequestPanel, type Row } from "./RequestPanel";

type Tab = OrderTab;
type State = OrderState;
const TABS = ORDER_TABS;

type Place = { city?: string; area?: string; address?: string; floor?: number };
/* eslint-disable @typescript-eslint/no-explicit-any -- rows differ per tab; fields are read defensively */
type PageData = { items: Row[]; total: number; page: number; pages: number };
type FetchResult = { key: string; data: PageData | null; error: boolean };
type SelectedOrder = { key: string; id: string | null };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <Orders />
    </Suspense>
  );
}

function OrdersLoading() {
  const { t } = useAdmin();
  return <p role="status" className="p-6 text-center text-muted">{t.loading}</p>;
}

function Orders() {
  const { t, lang } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = isTab(params.get("tab")) ? (params.get("tab") as Tab) : "furniture";
  const state: State = isState(params.get("state")) ? (params.get("state") as State) : "pending";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";
  const requestedPayoutStatus = params.get("payoutStatus");
  const payoutStatus = tab === "furniture" && (requestedPayoutStatus === "pending" || requestedPayoutStatus === "paid") ? requestedPayoutStatus : null;
  const filterKey = JSON.stringify([tab, state, page, q, payoutStatus]);

  const [result, setResult] = useState<FetchResult | null>(null);
  const [search, setSearch] = useState(q);
  const [flash, setFlash] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<SelectedOrder | null>(null);

  // The box follows the URL (sidebar links drop the search).
  const [shownQ, setShownQ] = useState(q);
  if (shownQ !== q) {
    setShownQ(q);
    setSearch(q);
  }

  function href(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    next.set("state", state);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (("state" in changes && changes.state !== state) || next.get("tab") !== "furniture") next.delete("payoutStatus");
    if (!payoutStatus && !("payoutStatus" in changes)) next.delete("payoutStatus");
    if (!("page" in changes)) next.delete("page");
    return `${pathname}?${next}`;
  }

  function go(changes: Record<string, string | null>) {
    router.replace(href(changes));
  }

  const qs = new URLSearchParams({ status: TABS[tab].states[state].join(","), page: String(page), limit: "20" });
  if (q) qs.set("q", q);
  if (payoutStatus) qs.set("payoutStatus", payoutStatus);
  const fetchPath = `${TABS[tab].path}?${qs}`;
  const requestKey = `${lang}:${version}:${fetchPath}`;
  const currentResult = result?.key === requestKey ? result : null;
  const data = currentResult?.data ?? null;
  const error = currentResult?.error ?? false;
  const searchedNumber = q.trim().toLowerCase();
  const defaultOpenId = data?.items.find((row) => searchedNumber && row.number.toLowerCase() === searchedNumber)?.id
    ?? (data?.items.length === 1 && (searchedNumber || payoutStatus === "pending") ? data.items[0].id : null);
  const openId = selected?.key === filterKey ? selected.id : defaultOpenId;

  // Capture the initial choice once per filter, including an intentional empty selection.
  // Keeping this state above fetched rows preserves it when a mutation reloads the list.
  if (tab === "furniture" && data && selected?.key !== filterKey) {
    setSelected({ key: filterKey, id: defaultOpenId });
  }

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    adminFetch<PageData>(fetchPath, { signal: controller.signal })
      .then((data) => { if (alive) setResult({ key: requestKey, data, error: false }); })
      .catch(() => { if (alive) setResult({ key: requestKey, data: null, error: true }); });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [fetchPath, requestKey]);

  const changed = (message: string) => {
    setFlash(message);
    setVersion((v) => v + 1);
    window.dispatchEvent(new Event(REQUESTS_CHANGED));
    window.setTimeout(() => setFlash(null), 5000);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{fill(t.pendingOf, { state: t[state], type: t[`${tab}Title` as "furnitureTitle"] })}</h1>

      <nav aria-label={lang === "ar" ? "حالة الطلبات" : "Order status"} className="flex flex-wrap gap-1 rounded-xl bg-beige p-1">
        {ORDER_STATES.map((value) => (
          <Link
            key={value}
            href={href({ state: value })}
            aria-current={state === value ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${state === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {t[value]}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: search.trim() || null });
          }}
          className="relative w-full sm:w-80"
        >
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} aria-label={t.search} className="field py-2! ps-9!" />
        </form>
        {payoutStatus && (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 ps-3 pe-1 text-sm">
            {t.payout}: {t.payoutStatus[payoutStatus]}
            <Link
              href={href({ payoutStatus: null })}
              aria-label={lang === "ar" ? "إزالة تصفية دفعة المالك" : "Remove owner payout filter"}
              className="grid size-8 place-items-center rounded-full hover:bg-beige"
            >
              <X aria-hidden className="size-4" />
            </Link>
          </span>
        )}
      </div>

      {flash && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
          {flash}
        </p>
      )}

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-red-700">
          <p>{t.error}</p>
          <button type="button" onClick={() => setVersion((v) => v + 1)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold hover:bg-red-100">{t.retry}</button>
        </div>
      ) : !data ? (
        <p role="status" className="p-6 text-center text-muted">{t.loading}</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">{t.empty}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{fill(t.total, { n: data.total })}</p>
          <ul className="space-y-2">
            {data.items.map((row) => (
              <OrderRow
                key={row.id}
                row={row}
                tab={tab}
                t={t}
                defaultOpen={!!searchedNumber && (data.items.length === 1 || row.number.toLowerCase() === searchedNumber)}
                open={tab === "furniture" ? openId === row.id : undefined}
                onToggle={tab === "furniture" ? () => setSelected({ key: filterKey, id: openId === row.id ? null : row.id }) : undefined}
                onChanged={changed}
              />
            ))}
          </ul>
          <Pagination page={data.page ?? page} pages={Math.max(1, data.pages)} onPage={(p) => go({ page: String(p) })} t={t} />
        </>
      )}
    </div>
  );
}

function OrderRow({ row, tab, t, defaultOpen, open: controlledOpen, onToggle, onChanged }: { row: Row; tab: Tab; t: AdminText; defaultOpen: boolean; open?: boolean; onToggle?: () => void; onChanged: (m: string) => void }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const { lang } = useAdmin();
  const name = row.customer?.name ?? row.name;
  const phone = row.customer?.phone ?? row.phone;
  const whatsappLabel = tab === "furniture" ? (lang === "ar" ? "واتساب المشتري" : "WhatsApp buyer") : t.whatsapp;
  const callLabel = tab === "furniture" ? (lang === "ar" ? "اتصال بالمشتري" : "Call buyer") : t.call;
  const contactClass = tab === "furniture" ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold hover:bg-beige" : "grid size-11 place-items-center rounded-full hover:bg-beige";
  const sep = lang === "ar" ? "، " : ", ";
  const placeText = (p?: Place) => (p ? [p.address, p.area, p.city].filter(Boolean).join(sep) || "—" : "—");
  const floorText = (p?: Place) => (p?.floor != null ? `${t.floor} ${p.floor}` : null);

  const summary =
    tab === "furniture"
      ? row.item?.title
      : tab === "movers"
        ? `${row.kind === "office" ? t.office : t.home} · ${row.from?.city ?? ""} → ${row.to?.city ?? ""}`
        : tab === "sell"
          ? row.title
          : tab === "pickup"
            ? `${t.workers}: ${row.workers} · ${row.from?.area ?? ""}`
            : tab === "recovery"
              ? `${row.vehicle} · ${row.from?.city ?? ""} → ${row.to?.city ?? ""}`
              : row.serviceName;

  const when =
    tab === "movers"
      ? fmtDate(row.visitDate)
      : tab === "technicians"
        ? fmtDate(row.preferredDate)
        : tab === "pickup" || tab === "recovery"
          ? fmtDate(row.date)
          : fmtDate(row.createdAt, true);

  return (
    <li className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <button type="button" onClick={onToggle ?? (() => setLocalOpen((o) => !o))} aria-expanded={open} className="flex min-w-0 flex-1 basis-60 items-center gap-3 text-start">
          <ChevronDown aria-hidden className={`size-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="font-mono text-sm font-bold">
                {row.number}
              </span>
              <span className="rounded-sm bg-beige px-2 py-0.5 text-xs font-semibold">{t.status[row.status] ?? row.status}</span>
              {tab === "sell" && <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold">{t.sellType[row.type] ?? row.type}</span>}
              {row.urgent && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  <Siren aria-hidden className="size-3" />
                  {t.urgent}
                </span>
              )}
              {(row.followUpDue || row.followUp?.due) && (
                <span className="rounded-sm bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{t.followUpDue}</span>
              )}
            </span>
            <span className="ugc mt-0.5 block text-sm">
              <bdi>{summary}</bdi> · <bdi className="font-semibold">{name}</bdi>
            </span>
          </span>
        </button>
        <span dir="ltr" className="text-sm text-muted">
          {when}
        </span>
        {tab === "furniture" && row.total != null && (
          <span className="font-bold">
            <Money amount={row.total} currency={row.currency ?? "AED"} locale={lang} />
          </span>
        )}
        {tab === "pickup" && row.quoteAmount != null && (
          <span className="font-bold">
            <Money amount={row.quoteAmount} currency={row.currency ?? "AED"} locale={lang} />
          </span>
        )}
        {tab === "sell" && row.askingPrice != null && (
          <span className="font-bold">
            <Money amount={row.askingPrice} currency={row.currency ?? "AED"} locale={lang} />
          </span>
        )}
        <span className="flex gap-1">
          {row.whatsappUrl && (
            <a href={row.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={whatsappLabel} className={contactClass}>
              <WhatsAppIcon className="size-5 text-whatsapp-dark" />
              {tab === "furniture" && <span>{whatsappLabel}</span>}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} aria-label={callLabel} className={contactClass}>
              <Phone aria-hidden className="size-4" />
              {tab === "furniture" && <span>{callLabel}</span>}
            </a>
          )}
        </span>
      </div>

      {open && (
        <>
          {tab !== "furniture" && <div className="space-y-4 border-t border-border p-4">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Field label={t.customer} value={<bdi>{name}</bdi>} />
              <Field label={t.call} value={<span dir="ltr">{phone}</span>} />
              <Field label={t.created} value={<span dir="ltr">{fmtDate(row.createdAt, true)}</span>} />
              {tab === "movers" && (
                <>
                  <Field label={row.kind === "office" ? t.office : t.home} value={row.kind === "office" ? `${row.workstations ?? "—"} ${t.workstations}` : `${row.rooms ?? "—"} ${t.rooms}`} />
                  {row.company && <Field label={t.company} value={row.company} />}
                  <Field label={t.from} value={[placeText(row.from), floorText(row.from)].filter(Boolean).join(" · ")} />
                  <Field label={t.to} value={[placeText(row.to), floorText(row.to)].filter(Boolean).join(" · ")} />
                  <Field label={t.visitDate} value={<span dir="ltr">{fmtDate(row.visitDate)}</span>} />
                  <Field
                    label={t.moveDate}
                    value={row.moveDate ? <span dir="ltr">{fmtDate(row.moveDate)}{row.flexibleDate ? ` (${t.flexible})` : ""}</span> : row.flexibleDate ? t.flexible : "—"}
                  />
                  {row.services?.length > 0 && <Field label={t.services} value={row.services.map((s: any) => s.label ?? s.key).join(sep)} />}
                  {row.details && <Field label={t.customerMessage} value={row.details} />}
                </>
              )}
              {tab === "technicians" && (
                <>
                  <Field label={t.service} value={row.serviceName} />
                  <Field label={t.preferred} value={<span>{fmtDate(row.preferredDate)} · {t.times[row.preferredTime] ?? row.preferredTime ?? ""}</span>} />
                  <Field label={t.address} value={placeText({ city: row.city, area: row.area, address: row.address })} />
                  <Field label={t.customerMessage} value={row.description} />
                </>
              )}
              {tab === "pickup" && (
                <>
                  <Field label={t.rentalDay} value={<span dir="ltr">{fmtDate(row.date)}</span>} />
                  <Field label={t.workers} value={row.workers} />
                  {row.estimate?.hours != null && <Field label={t.rentalHours} value={row.estimate.hours} />}
                  <Field label={t.truckComesTo} value={placeText(row.from)} />
                  {row.estimate && (
                    <Field
                      label={t.estimate}
                      value={
                        <span>
                          <Money amount={row.estimate.total} currency={row.currency} locale={lang} />{" "}
                          <span dir="ltr" className="text-muted">
                            ({row.estimate.basePrice} + {row.workers} × {row.estimate.workerPrice})
                          </span>
                        </span>
                      }
                    />
                  )}
                  {row.details && <Field label={t.customerMessage} value={row.details} />}
                </>
              )}
              {tab === "recovery" && (
                <>
                  <Field label={t.vehicle} value={row.vehicle} />
                  <Field label={t.jobDay} value={<span dir="ltr">{fmtDate(row.date)}</span>} />
                  <Field label={t.carIsAt} value={placeText(row.from)} />
                  <Field label={t.takeItTo} value={placeText(row.to)} />
                  {row.details && <Field label={t.customerMessage} value={row.details} />}
                </>
              )}
              {tab === "sell" && (
                <>
                  <Field label={t.item} value={row.title} />
                  {row.category?.name && <Field label={t.category} value={row.category.name?.[lang] ?? row.category.name} />}
                  <Field label={t.askingPrice} value={<Money amount={row.askingPrice} currency={row.currency ?? "AED"} locale={lang} />} />
                  {row.condition && <Field label={t.condition} value={t.conditions[row.condition] ?? row.condition} />}
                  <Field label={t.address} value={placeText({ city: row.city, area: row.area })} />
                  <Field label={t.customerMessage} value={row.description} />
                </>
              )}
            </dl>
            <Photos photos={row.photos} t={t} />
          </div>}
          <RequestPanel row={row} tab={tab} onChanged={onChanged} />
        </>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{label}:</dt>
      <dd className="ugc min-w-0 whitespace-pre-line break-words font-medium">{value}</dd>
    </div>
  );
}
