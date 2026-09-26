"use client";

import { ChevronDown, Phone, Search, Siren } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import { adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill, type AdminText } from "../i18n";
import { Pagination } from "../Pagination";
import { isState, isTab, ORDER_TABS, type OrderState, type OrderTab } from "../orderTabs";

type Tab = OrderTab;
type State = OrderState;
const TABS = ORDER_TABS;

type Place = { city?: string; area?: string; address?: string; floor?: number };
/* eslint-disable @typescript-eslint/no-explicit-any -- rows differ per tab; fields are read defensively */
type Row = Record<string, any> & { id: string; number: string; status: string; createdAt?: string; whatsappUrl?: string };
type PageData = { items: Row[]; total: number; page: number; pages: number };

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const { t } = useAdmin();
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
  }, [tab, state, page, q]);


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
              <OrderRow key={row.id} row={row} tab={tab} t={t} />
            ))}
          </ul>
          <Pagination page={data.page ?? page} pages={Math.max(1, data.pages)} onPage={(p) => go({ page: String(p) })} t={t} />
        </>
      )}
    </div>
  );
}

const fmtDate = (v?: string, withTime = false) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        timeZone: "Asia/Dubai",
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "—";

const placeText = (p?: Place, floorLabel = "") =>
  p ? [p.address, p.area, p.city, p.floor != null ? `${floorLabel} ${p.floor}` : ""].filter(Boolean).join("، ") : "—";

function OrderRow({ row, tab, t }: { row: Row; tab: Tab; t: AdminText }) {
  const [open, setOpen] = useState(false);
  const { lang } = useAdmin();
  const name = row.customer?.name ?? row.name;
  const phone = row.customer?.phone ?? row.phone;

  const summary =
    tab === "furniture"
      ? row.item?.title
      : tab === "movers"
        ? `${row.kind === "office" ? t.office : t.home} · ${row.from?.city ?? ""} → ${row.to?.city ?? ""}`
        : row.serviceName;

  const when =
    tab === "movers" ? fmtDate(row.visitDate) : tab === "technicians" ? fmtDate(row.preferredDate) : fmtDate(row.createdAt, true);

  return (
    <li className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-start">
          <ChevronDown aria-hidden className={`size-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="font-mono text-sm font-bold">
                {row.number}
              </span>
              <span className="rounded-sm bg-beige px-2 py-0.5 text-xs font-semibold">{t.status[row.status] ?? row.status}</span>
              {row.urgent && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  <Siren aria-hidden className="size-3" />
                  {t.urgent}
                </span>
              )}
            </span>
            <span className="ugc mt-0.5 block truncate text-sm">
              {summary} · {name}
            </span>
          </span>
        </button>
        <span className="text-sm text-muted">{when}</span>
        {tab === "furniture" && row.total != null && (
          <span className="font-bold">
            <Money amount={row.total} currency={row.currency ?? "AED"} locale={lang} />
          </span>
        )}
        <span className="flex gap-1">
          {row.whatsappUrl && (
            <a href={row.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp} className="grid size-9 place-items-center rounded-full hover:bg-beige">
              <WhatsAppIcon className="size-5 text-whatsapp-dark" />
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} aria-label={t.call} className="grid size-9 place-items-center rounded-full hover:bg-beige">
              <Phone aria-hidden className="size-4" />
            </a>
          )}
        </span>
      </div>

      {open && (
        <dl className="grid gap-x-6 gap-y-2 border-t border-border p-4 text-sm sm:grid-cols-2">
          <Field label={t.created} value={fmtDate(row.createdAt, true)} />
          <Field label={t.call} value={<span dir="ltr">{phone}</span>} />
          {tab === "furniture" && (
            <>
              <Field label={t.item} value={<span className="ugc">{`${row.item?.title ?? ""} (${row.item?.ref ?? ""})`}</span>} />
              <Field label={t.price} value={<Money amount={row.price} currency={row.currency} locale={lang} />} />
              <Field
                label={row.fulfilment === "pickup" ? t.pickup : t.delivery}
                value={row.fulfilment === "pickup" ? "—" : <Money amount={row.deliveryFee ?? 0} currency={row.currency} locale={lang} />}
              />
              {row.services?.length > 0 && (
                <Field
                  label={t.services}
                  value={row.services.map((s: any) => `${s.name?.[lang] ?? s.key} ${s.fee}`).join("، ")}
                />
              )}
              <Field label={t.total_} value={<Money amount={row.total} currency={row.currency} locale={lang} />} />
              <Field label={t.address} value={placeText(row.customer)} />
              {row.customer?.notes && <Field label={t.notes} value={row.customer.notes} />}
            </>
          )}
          {tab === "movers" && (
            <>
              {row.company && <Field label="Company" value={row.company} />}
              <Field label={t.from} value={placeText(row.from, t.floor)} />
              <Field label={t.to} value={placeText(row.to, t.floor)} />
              <Field label={t.visitDate} value={fmtDate(row.visitDate)} />
              <Field label={t.moveDate} value={fmtDate(row.moveDate)} />
              {row.rooms != null && <Field label={t.rooms} value={row.rooms} />}
              {row.workstations != null && <Field label={t.workstations} value={row.workstations} />}
              {row.services?.length > 0 && <Field label={t.services} value={row.services.map((s: any) => s.label ?? s.key).join("، ")} />}
              {row.details && <Field label={t.notes} value={row.details} />}
            </>
          )}
          {tab === "technicians" && (
            <>
              <Field label={t.service} value={row.serviceName} />
              <Field label={t.preferred} value={`${fmtDate(row.preferredDate)} · ${t.times[row.preferredTime] ?? row.preferredTime ?? ""}`} />
              <Field label={t.address} value={placeText({ city: row.city, area: row.area, address: row.address })} />
              <Field label={t.notes} value={row.description} />
            </>
          )}
        </dl>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{label}:</dt>
      <dd className="ugc min-w-0 break-words font-medium">{value}</dd>
    </div>
  );
}
