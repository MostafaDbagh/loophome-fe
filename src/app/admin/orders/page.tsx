"use client";

import { ChevronDown, Phone, Search, Siren } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import { adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill, type AdminText } from "../i18n";

type Tab = "furniture" | "movers" | "technicians";
type State = "pending" | "completed" | "cancelled";

/** Which API list each tab reads, and which statuses make up each state. */
const TABS: Record<Tab, { path: string; states: Record<State, string[]> }> = {
  furniture: {
    path: "/admin/orders",
    states: { pending: ["new", "confirmed", "out_for_delivery"], completed: ["delivered"], cancelled: ["cancelled"] },
  },
  movers: {
    path: "/admin/moves",
    states: {
      pending: ["new", "contacted", "survey_scheduled", "surveyed", "quoted", "booked"],
      completed: ["completed"],
      cancelled: ["rejected", "cancelled"],
    },
  },
  technicians: {
    path: "/admin/technician-requests",
    states: { pending: ["new", "contacted", "scheduled"], completed: ["completed"], cancelled: ["rejected", "cancelled"] },
  },
};

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
  const tab = (params.get("tab") as Tab) in TABS ? (params.get("tab") as Tab) : "furniture";
  const state = (["pending", "completed", "cancelled"] as State[]).includes(params.get("state") as State)
    ? (params.get("state") as State)
    : "pending";
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
      <h1 className="text-2xl font-extrabold">{t[`${tab}Title` as "furnitureTitle"]}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex gap-1 rounded-full bg-beige p-1">
          {(["pending", "completed", "cancelled"] as State[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={state === s}
              onClick={() => go({ state: s })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${state === s ? "bg-surface shadow" : "text-muted"}`}
            >
              {t[s]}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: search.trim() || null });
          }}
          className="relative ms-auto w-full sm:w-72"
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

/** Always-visible pager: previous/next plus numbered pages (current ±1, first and last). */
function Pagination({ page, pages, onPage, t }: { page: number; pages: number; onPage: (p: number) => void; t: AdminText }) {
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav aria-label={fill(t.page, { page, pages })} className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-ghost px-3! py-1.5! text-sm disabled:opacity-40">
        {t.prev}
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-muted">…</span>}
          <button
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${n === page ? "bg-ink text-white" : "border border-border hover:border-ink/40"}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="btn-ghost px-3! py-1.5! text-sm disabled:opacity-40">
        {t.next}
      </button>
      <span className="w-full text-center text-xs text-muted">{fill(t.page, { page, pages })}</span>
    </nav>
  );
}
