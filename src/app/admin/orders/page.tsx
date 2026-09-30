"use client";

import { ChevronDown, Phone, Search, Siren } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import { adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill, type AdminText } from "../i18n";
import { Pagination } from "../Pagination";
import { isState, isTab, ORDER_TABS, REQUESTS_CHANGED, type OrderState, type OrderTab } from "../orderTabs";
import { fmtDate, Photos, RequestPanel, type Row } from "./RequestPanel";

type Tab = OrderTab;
type State = OrderState;
const TABS = ORDER_TABS;

type Place = { city?: string; area?: string; address?: string; floor?: number };
/* eslint-disable @typescript-eslint/no-explicit-any -- rows differ per tab; fields are read defensively */
type PageData = { items: Row[]; total: number; page: number; pages: number };

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
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

  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(q);
  const [flash, setFlash] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // The box follows the URL (sidebar links drop the search).
  const [shownQ, setShownQ] = useState(q);
  if (shownQ !== q) {
    setShownQ(q);
    setSearch(q);
  }

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(`${pathname}?${next}`);
  }

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ status: TABS[tab].states[state].join(","), page: String(page), limit: "20" });
    if (q) qs.set("q", q);
    adminFetch<PageData>(`${TABS[tab].path}?${qs}`)
      .then((d) => alive && (setData(d), setError(false)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [tab, state, page, q, lang, version]);

  const changed = useCallback((message: string) => {
    setFlash(message);
    setVersion((v) => v + 1);
    window.dispatchEvent(new Event(REQUESTS_CHANGED));
    window.setTimeout(() => setFlash(null), 5000);
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{fill(t.pendingOf, { state: t[state], type: t[`${tab}Title` as "furnitureTitle"] })}</h1>

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
      </div>

      {flash && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
          {flash}
        </p>
      )}

      {error ? (
        <p className="rounded-xl bg-red-50 p-4 text-red-700">{t.error}</p>
      ) : !data ? (
        <p className="p-6 text-center text-muted">{t.loading}</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">{t.empty}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{fill(t.total, { n: data.total })}</p>
          <ul className="space-y-2">
            {data.items.map((row) => (
              // Searching a reference (e.g. from an alert email), or finding just one request, opens it.
              <OrderRow
                key={row.id}
                row={row}
                tab={tab}
                t={t}
                defaultOpen={!!q && (data.items.length === 1 || row.number.toLowerCase() === q.trim().toLowerCase())}
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

function OrderRow({ row, tab, t, defaultOpen, onChanged }: { row: Row; tab: Tab; t: AdminText; defaultOpen: boolean; onChanged: (m: string) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const { lang } = useAdmin();
  const name = row.customer?.name ?? row.name;
  const phone = row.customer?.phone ?? row.phone;
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
          : row.serviceName;

  const when =
    tab === "movers" ? fmtDate(row.visitDate) : tab === "technicians" ? fmtDate(row.preferredDate) : fmtDate(row.createdAt, true);

  return (
    <li className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 basis-60 items-center gap-3 text-start">
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
        {tab === "sell" && row.askingPrice != null && (
          <span className="font-bold">
            <Money amount={row.askingPrice} currency={row.currency ?? "AED"} locale={lang} />
          </span>
        )}
        <span className="flex gap-1">
          {row.whatsappUrl && (
            <a href={row.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp} className="grid size-11 place-items-center rounded-full hover:bg-beige">
              <WhatsAppIcon className="size-5 text-whatsapp-dark" />
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} aria-label={t.call} className="grid size-11 place-items-center rounded-full hover:bg-beige">
              <Phone aria-hidden className="size-4" />
            </a>
          )}
        </span>
      </div>

      {open && (
        <>
          <div className="space-y-4 border-t border-border p-4">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Field label={t.customer} value={<bdi>{name}</bdi>} />
              <Field label={t.call} value={<span dir="ltr">{phone}</span>} />
              <Field label={t.created} value={<span dir="ltr">{fmtDate(row.createdAt, true)}</span>} />
              {tab === "furniture" && (
                <>
                  <Field label={t.item} value={<span className="ugc">{`${row.item?.title ?? ""} (${row.item?.ref ?? ""})`}</span>} />
                  <Field label={t.price} value={<Money amount={row.price} currency={row.currency} locale={lang} />} />
                  {row.fulfilment === "pickup" ? (
                    <Field label={t.pickup} value={t.pickupWarehouse} />
                  ) : (
                    <>
                      <Field label={t.delivery} value={<Money amount={row.deliveryFee ?? 0} currency={row.currency} locale={lang} />} />
                      <Field label={t.address} value={placeText(row.customer)} />
                    </>
                  )}
                  {row.services?.length > 0 && (
                    <Field
                      label={t.services}
                      value={row.services.map((s: any) => (
                        <span key={s.key} className="block">
                          {s.name?.[lang] ?? s.key} · {s.fee ? <Money amount={s.fee} currency={row.currency} locale={lang} /> : t.freeWord}
                        </span>
                      ))}
                    />
                  )}
                  <Field label={t.total_} value={<Money amount={row.total} currency={row.currency} locale={lang} />} />
                  {row.customer?.notes && <Field label={t.customerMessage} value={row.customer.notes} />}
                </>
              )}
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
          </div>
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
