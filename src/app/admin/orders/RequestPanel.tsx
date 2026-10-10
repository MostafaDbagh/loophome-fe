"use client";

import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Money } from "@/components/Money";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill, type AdminText } from "../i18n";
import { ORDER_TABS, type OrderTab } from "../orderTabs";
import { FurnitureHistory, FurnitureOrderDetails, OrderProgress, orderFlowCopy } from "./OrderDetails";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows differ per tab; fields are read defensively */
export type Row = Record<string, any> & { id: string; number: string; status: string; nextStatuses?: string[] };

// Inputs are Dubai wall-clock time; the API takes ISO dates.
const toDubaiInput = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Dubai" }).replace(" ", "T").slice(0, 16) : "";
const fromDubaiInput = (v: string) => new Date(`${v}:00+04:00`).toISOString();
/** A follow-up is a day, not a time: 9am Dubai. */
const followUpIso = (day: string) => (day ? new Date(`${day}T09:00:00+04:00`).toISOString() : null);

export const fmtDate = (v?: string | null, withTime = false) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        timeZone: "Asia/Dubai",
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "—";

type FieldDef = {
  name: string;
  label: string;
  kind: "text" | "long" | "money" | "datetime" | "select";
  /** patch = saved on the record first; body = sent with the status change or action. */
  via: "patch" | "body";
  required?: boolean;
  initial?: string | number | null;
  options?: [string, string][];
};

/** What each next step asks for; the API still enforces every rule. `__collect`/`__approve` are sell-request actions. */
function fieldsFor(tab: OrderTab, to: string, row: Row, t: AdminText): FieldDef[] {
  const note: FieldDef = { name: "note", label: t.noteOptional, kind: "text", via: "body" };
  const reason = (name: string): FieldDef => ({ name, label: t.reason, kind: "text", via: "body", required: true });
  if (tab === "furniture") {
    if (to === "cancelled") return [reason("cancelReason")];
    if (to === "delivered") return [{ name: "cashCollected", label: t.cashCollected, kind: "money", via: "body", initial: row.total }, note];
    return [note];
  }
  if (tab === "movers") {
    if (to === "survey_scheduled")
      return [{ name: "surveyAt", label: t.surveyAt, kind: "datetime", via: "patch", required: true, initial: toDubaiInput(row.surveyAt) }, note];
    if (to === "surveyed")
      return [
        { name: "surveyAt", label: t.surveyAt, kind: "datetime", via: "patch", required: true, initial: toDubaiInput(row.surveyAt) },
        { name: "surveyNotes", label: t.surveyNotes, kind: "long", via: "patch", initial: row.surveyNotes },
      ];
    if (to === "quoted")
      return [
        { name: "quoteAmount", label: t.quote, kind: "money", via: "patch", required: true, initial: row.quote?.amount },
        { name: "quoteNote", label: t.quoteNote, kind: "text", via: "patch", initial: row.quote?.note },
      ];
    if (to === "booked")
      return [
        {
          name: "scheduledAt",
          label: t.scheduledAt,
          kind: "datetime",
          via: "patch",
          required: true,
          initial: toDubaiInput(row.scheduledAt) || (row.moveDate ? `${toDubaiInput(row.moveDate).slice(0, 10)}T08:00` : ""),
        },
        { name: "crew", label: t.crew, kind: "text", via: "patch", initial: row.crew },
      ];
    if (to === "completed")
      return [
        { name: "finalAmount", label: t.finalAmount, kind: "money", via: "body", required: true, initial: row.quote?.amount },
        { name: "cashCollected", label: t.cashCollected, kind: "money", via: "body", initial: row.quote?.amount },
      ];
    if (to === "rejected" || to === "cancelled") return [reason("reason")];
    return [note];
  }
  if (tab === "technicians") {
    if (to === "scheduled")
      return [
        { name: "visitAt", label: t.visitAt, kind: "datetime", via: "patch", required: true, initial: toDubaiInput(row.visitAt) },
        { name: "technician", label: t.technician, kind: "text", via: "patch", initial: row.technician },
        { name: "quoteAmount", label: t.agreedAmount, kind: "money", via: "patch", initial: row.quoteAmount },
      ];
    if (to === "completed")
      return [
        { name: "amount", label: t.amount, kind: "money", via: "body", required: true, initial: row.amount ?? row.quoteAmount },
        { name: "cashCollected", label: t.cashCollected, kind: "money", via: "body", initial: row.amount ?? row.quoteAmount },
        { name: "workDone", label: t.workDone, kind: "long", via: "body", initial: row.workDone },
      ];
    if (to === "rejected" || to === "cancelled") return [reason("reason")];
    return [note];
  }
  if (tab === "pickup" || tab === "recovery") {
    if (to === "scheduled")
      return [
        {
          name: "scheduledAt",
          label: t.truckTime,
          kind: "datetime",
          via: "patch",
          required: true,
          initial: toDubaiInput(row.scheduledAt) || (row.date ? `${toDubaiInput(row.date).slice(0, 10)}T08:00` : ""),
        },
        { name: "driver", label: t.driver, kind: "text", via: "patch", initial: row.driver },
        { name: "quoteAmount", label: t.agreedAmount, kind: "money", via: "patch", initial: row.quoteAmount },
      ];
    if (to === "completed")
      return [
        { name: "amount", label: t.amount, kind: "money", via: "body", required: true, initial: row.amount ?? row.quoteAmount },
        { name: "cashCollected", label: t.cashCollected, kind: "money", via: "body", initial: row.amount ?? row.quoteAmount },
      ];
    if (to === "rejected" || to === "cancelled") return [reason("reason")];
    return [note];
  }
  // sell requests
  if (to === "agreed")
    return [
      { name: "offeredPrice", label: t.offeredPrice, kind: "money", via: "patch", initial: row.offeredPrice },
      { name: "agreedPrice", label: t.agreedPrice, kind: "money", via: "patch", required: true, initial: row.agreedPrice ?? row.askingPrice },
    ];
  if (to === "pickup_scheduled")
    return [
      { name: "pickupAt", label: t.pickupAt, kind: "datetime", via: "patch", required: true, initial: toDubaiInput(row.pickupAt) },
      {
        name: "pickupAddress",
        label: t.pickupAddress,
        kind: "text",
        via: "patch",
        initial: row.pickupAddress || [row.area, row.city].filter(Boolean).join(", "),
      },
    ];
  if (to === "rejected") return [reason("rejectReason")];
  if (to === "__collect")
    return [
      { name: "storageLocation", label: t.storageLocation, kind: "text", via: "body" },
      { name: "notes", label: t.noteOptional, kind: "long", via: "body" },
    ];
  if (to === "__approve")
    return [
      {
        name: "condition",
        label: t.condition,
        kind: "select",
        via: "body",
        required: true,
        initial: row.condition ?? "",
        options: Object.entries(t.conditions),
      },
      { name: "price", label: t.listingPrice, kind: "money", via: "body", required: true, initial: row.askingPrice },
    ];
  return [note];
}

/** Details are refreshed after every saved action, including edits and payments that keep the same status. */
export function RequestPanel({ row, tab, onChanged }: { row: Row; tab: OrderTab; onChanged: (message: string) => void }) {
  const { t, lang, admin } = useAdmin();
  const c = orderFlowCopy[lang];
  const base = `${ORDER_TABS[tab].path}/${row.id}`;
  const [step, setStep] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const detailKey = `${base}:${lang}:${row.updatedAt}:${row.status}:${revision}`;
  const [detail, setDetail] = useState<{ key: string; row?: Row; error?: string } | null>(null);
  useEffect(() => {
    if (tab !== "furniture") return;
    let alive = true;
    adminFetch<Row>(base)
      .then((data) => { if (alive) setDetail({ key: detailKey, row: data }); })
      .catch((err) => { if (alive) setDetail({ key: detailKey, error: adminErrorText(err, c.detailError) }); });
    return () => { alive = false; };
  }, [base, tab, detailKey, c.detailError]);

  const currentDetail = detail?.key === detailKey ? detail : null;
  const record = currentDetail?.row ?? row;
  const loaded = !!currentDetail?.row;
  const changed = (message: string) => {
    setRevision((n) => n + 1);
    onChanged(message);
  };
  const steps: string[] = [...(record.nextStatuses ?? [])];
  if (tab === "sell" && record.type === "sell" && (record.status === "agreed" || record.status === "pickup_scheduled")) steps.unshift("__collect");
  if (tab === "sell" && record.type === "list" && (record.status === "new" || record.status === "contacted")) steps.unshift("__approve");
  const stepLabel = (s: string) => (s === "__collect" ? t.collect : s === "__approve" ? t.approveListing : s === "delivered" && tab === "furniture" && record.fulfilment === "pickup" ? (lang === "ar" ? "تأكيد استلام المشتري" : "Complete buyer pickup") : (t.status[s] ?? s));
  const danger = (s: string) => s === "cancelled" || s === "rejected";
  const actionButton = (s: string) => (
    <button key={s} type="button" disabled={tab === "furniture" && !loaded} onClick={() => setStep(step === s ? null : s)} aria-expanded={step === s}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${step === s ? "border-ink bg-ink text-white" : danger(s) ? "border-red-200 text-red-700 hover:bg-red-50" : "border-border hover:border-ink"}`}>
      {!danger(s) && <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />}{stepLabel(s)}
    </button>
  );

  return (
    <div className="space-y-5 border-t border-border p-4">
      {tab === "furniture" && <>
        {currentDetail?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p>{currentDetail.error}</p><button type="button" onClick={() => setRevision((n) => n + 1)} className="mt-2 inline-flex min-h-9 items-center gap-2 font-semibold underline"><RotateCcw aria-hidden className="size-4" />{c.refresh}</button></div>}
        <OrderProgress row={record} t={t} lang={lang} />
        <FurnitureOrderDetails row={record} t={t} lang={lang} loaded={loaded} failed={!!currentDetail?.error} />
        {loaded && record.status === "delivered" && record.inventorySource === "consignment" && record.seller?.payoutStatus === "pending" && <OwnerBox owner={record.seller} row={record} t={t} lang={lang} canPay={admin.role === "owner"} onChanged={changed} />}
      </>}
      {tab !== "furniture" && <WorkDetails row={record} tab={tab} t={t} lang={lang} />}

      <div className={tab === "furniture" ? "grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "space-y-5"}>
        <div className="min-w-0 space-y-5">
          {steps.length > 0 && (
            <section aria-label={t.actions} className={tab === "furniture" ? "rounded-xl border border-border p-4" : ""}>
              <h3 className="mb-3 font-bold">{tab === "furniture" ? c.actions : t.moveTo}</h3>
              <div className="flex flex-wrap gap-2">{steps.filter((s) => !danger(s)).map(actionButton)}</div>
              {steps.some(danger) && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-red-700">{tab === "furniture" ? c.cancelOrder : t.reason}</summary><div className="mt-2 flex flex-wrap gap-2">{steps.filter(danger).map(actionButton)}</div></details>}
              {step && (
                <StepForm key={step} fields={fieldsFor(tab, step, record, t)} t={t} submitLabel={stepLabel(step)} onCancel={() => setStep(null)}
                  onSubmit={async (patch, body) => {
                    if (Object.keys(patch).length) await adminFetch(base, { method: "PATCH", body: JSON.stringify(patch) });
                    if (step === "__collect") await adminFetch(`${base}/collect`, { method: "POST", body: JSON.stringify(body) });
                    else if (step === "__approve") await adminFetch(`${base}/approve-listing`, { method: "POST", body: JSON.stringify(body) });
                    else await adminFetch(`${base}/status`, { method: "POST", body: JSON.stringify({ status: step, ...body }) });
                    setStep(null);
                    changed(fill(t.movedTo, { number: record.number, status: step === "__collect" ? t.status.collected : step === "__approve" ? t.status.listed : (t.status[step] ?? step) }));
                  }} />
              )}
            </section>
          )}
          {tab === "furniture" && ["new", "confirmed", "out_for_delivery"].includes(record.status) && <OrderEdit key={record.updatedAt} row={record} t={t} base={base} onChanged={changed} />}
          <div className={tab === "furniture" ? "rounded-xl border border-border p-4" : ""}>
            {tab === "sell" ? <FollowUp row={record} t={t} base={base} onChanged={changed} /> : <Notes row={record} t={t} base={base} onChanged={changed} />}
          </div>
        </div>
        {tab === "furniture" ? <FurnitureHistory row={record} t={t} lang={lang} /> : <Timeline row={record} tab={tab} t={t} />}
      </div>
    </div>
  );
}

function StepForm({
  fields,
  t,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  fields: FieldDef[];
  t: AdminText;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (patch: Record<string, unknown>, body: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.initial == null ? "" : String(f.initial)])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const patch: Record<string, unknown> = {};
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (!v) {
        if (f.required) return setError(`${f.label}: ${t.required}`);
        continue;
      }
      const out = f.kind === "money" ? Number(v) : f.kind === "datetime" ? fromDubaiInput(v) : v;
      (f.via === "patch" ? patch : body)[f.name] = out;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(patch, body);
    } catch (err) {
      setError(adminErrorText(err, t.error));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl bg-background p-4">
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="label">
            {f.label}
            {f.required && " *"}
          </span>
          {f.kind === "long" ? (
            <textarea value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} rows={2} maxLength={2000} className="field" />
          ) : f.kind === "select" ? (
            <select value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className="field">
              <option value="" />
              {f.options?.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.kind === "money" ? "number" : f.kind === "datetime" ? "datetime-local" : "text"}
              inputMode={f.kind === "money" ? "decimal" : undefined}
              min={f.kind === "money" ? 0 : undefined}
              step={f.kind === "money" ? "any" : undefined}
              dir={f.kind === "text" ? undefined : "ltr"}
              value={values[f.name]}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              maxLength={f.kind === "text" ? 500 : undefined}
              className="field text-start"
            />
          )}
        </label>
      ))}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-cta">
          {busy ? t.saving : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-beige">
          {t.dismiss}
        </button>
      </div>
    </form>
  );
}

/** The work record: what was booked, quoted, charged, and why something was rejected. */
function WorkDetails({ row, tab, t, lang }: { row: Row; tab: OrderTab; t: AdminText; lang: "ar" | "en" }) {
  const money = (n?: number | null) => (n == null ? null : <Money amount={n} currency={row.currency ?? "AED"} locale={lang} maximumFractionDigits={2} />);
  const items: [string, React.ReactNode][] = [];
  const add = (label: string, value: React.ReactNode) => value != null && value !== "" && items.push([label, value]);
  if (tab === "furniture") {
    add(t.cashCollected, money(row.cashCollected));
    add(t.internalNote, row.adminNotes);
  }
  if (tab === "movers") {
    add(t.surveyAt, row.surveyAt && fmtDate(row.surveyAt, true));
    add(t.surveyNotes, row.surveyNotes);
    add(t.quote, money(row.quote?.amount));
    add(t.quoteNote, row.quote?.note);
    add(t.scheduledAt, row.scheduledAt && fmtDate(row.scheduledAt, true));
    add(t.crew, row.crew);
    add(t.finalAmount, money(row.finalAmount));
    add(t.cashCollected, money(row.cashCollected));
  }
  if (tab === "technicians") {
    add(t.visitAt, row.visitAt && fmtDate(row.visitAt, true));
    add(t.technician, row.technician);
    add(t.agreedAmount, money(row.quoteAmount));
    add(t.amount, money(row.amount));
    add(t.cashCollected, money(row.cashCollected));
    add(t.workDone, row.workDone);
  }
  if (tab === "pickup" || tab === "recovery") {
    add(t.truckTime, row.scheduledAt && fmtDate(row.scheduledAt, true));
    add(t.driver, row.driver);
    add(t.agreedAmount, money(row.quoteAmount));
    add(t.amount, money(row.amount));
    add(t.cashCollected, money(row.cashCollected));
  }
  if (tab === "sell") {
    add(t.offeredPrice, money(row.offeredPrice));
    add(t.agreedPrice, money(row.agreedPrice));
    add(t.pickupAt, row.pickupAt && fmtDate(row.pickupAt, true));
    add(t.pickupAddress, row.pickupAddress);
  }
  add(t.reason, row.cancelReason || row.rejectReason);
  if (!items.length) return null;
  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-beige/60 p-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt className="shrink-0 text-muted">{label}:</dt>
          <dd className="ugc min-w-0 whitespace-pre-line break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Owner-only recording of an already completed seller payment. */
function OwnerBox({ owner, row, t, lang, canPay, onChanged }: { owner: any; row: Row; t: AdminText; lang: "ar" | "en"; canPay: boolean; onChanged: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = orderFlowCopy[lang];
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <h3 className="font-bold">{c.recordPayment}{owner.payout != null && <> · <Money amount={owner.payout} currency={row.currency ?? "AED"} locale={lang} maximumFractionDigits={2} /></>}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{canPay ? c.paymentHelp : c.staffPayout}</p>
      {canPay && <button type="button" disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        try {
          await adminFetch(`/admin/inventory/${row.inventoryItem}/payout`, { method: "POST" });
          onChanged(`${row.number}: ${t.payoutStatus.paid}`);
        } catch (err) { setError(adminErrorText(err, t.error)); }
        setBusy(false);
      }} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 font-semibold text-white"><Check aria-hidden className="size-4" />{busy ? t.saving : t.markPaid}</button>}
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    </section>
  );
}

/** Open orders: agreed discounts or delivery changes, plus a note for the team. */
function OrderEdit({ row, t, base, onChanged }: { row: Row; t: AdminText; base: string; onChanged: (m: string) => void }) {
  const [price, setPrice] = useState(String(row.price ?? ""));
  const [fee, setFee] = useState(String(row.deliveryFee ?? 0));
  const [note, setNote] = useState(row.adminNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (price !== "" && Number(price) !== row.price) body.price = Number(price);
    if (row.fulfilment !== "pickup" && fee !== "" && Number(fee) !== row.deliveryFee) body.deliveryFee = Number(fee);
    if (note.trim() !== (row.adminNotes ?? "")) body.adminNotes = note.trim();
    if (!Object.keys(body).length) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(base, { method: "PATCH", body: JSON.stringify(body) });
      onChanged(`${row.number}: ${t.savedShort}`);
    } catch (err) {
      setError(adminErrorText(err, t.error));
    }
    setBusy(false);
  }

  return (
    <details className="rounded-xl border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">{t.editOrder}</summary>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t.price}</span>
          <input type="number" min={0} step="any" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} className="field text-start" />
        </label>
        {row.fulfilment !== "pickup" && (
          <label className="block">
            <span className="label">{t.deliveryFee}</span>
            <input type="number" min={0} step="any" dir="ltr" value={fee} onChange={(e) => setFee(e.target.value)} className="field text-start" />
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="label">{t.internalNote}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className="field" />
        </label>
        {error && <p className="text-red-700 sm:col-span-2">{error}</p>}
        <button type="submit" disabled={busy} className="btn-cta justify-self-start">
          {busy ? t.saving : t.saveDraft}
        </button>
      </form>
    </details>
  );
}

/** Orders and service requests: log a follow-up, optionally setting the next follow-up day. */
function Notes({ row, t, base, onChanged }: { row: Row; t: AdminText; base: string; onChanged: (m: string) => void }) {
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`${base}/notes`, { method: "POST", body: JSON.stringify({ note: note.trim(), ...(day && { nextFollowUpAt: followUpIso(day) }) }) });
      setNote("");
      setDay("");
      onChanged(`${row.number}: ${t.savedShort}`);
    } catch (err) {
      setError(adminErrorText(err, t.error));
    }
    setBusy(false);
  }

  return (
    <section className="text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {t.teamNotes}
        {row.nextFollowUpAt && (
          <span className={`ms-2 rounded-sm px-2 py-0.5 normal-case ${row.followUpDue ? "bg-red-50 text-red-700" : "bg-beige text-ink"}`}>
            {row.followUpDue ? t.followUpDue : t.nextFollowUp}: {fmtDate(row.nextFollowUpAt)}
          </span>
        )}
      </h3>
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="block min-w-48 flex-1">
          <span className="sr-only">{t.addNote}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.addNote} maxLength={2000} className="field" />
        </label>
        <label className="block">
          <span className="label">{t.nextFollowUp}</span>
          <input type="date" dir="ltr" value={day} onChange={(e) => setDay(e.target.value)} className="field text-start" />
        </label>
        <button type="submit" disabled={busy || !note.trim()} className="btn-cta">
          {busy ? t.saving : t.saveNote}
        </button>
      </form>
      {error && <p className="mt-2 text-red-700">{error}</p>}
    </section>
  );
}

/** Sell requests: the owner follow-up log (status, note, next contact day). */
function FollowUp({ row, t, base, onChanged }: { row: Row; t: AdminText; base: string; onChanged: (m: string) => void }) {
  const f = row.followUp ?? {};
  const [status, setStatus] = useState<string>(f.status ?? "new");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (status !== (f.status ?? "new")) body.status = status;
    if (note.trim()) body.note = note.trim();
    if (day) body.nextFollowUpAt = followUpIso(day);
    if (!Object.keys(body).length) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`${base}/follow-up`, { method: "POST", body: JSON.stringify(body) });
      setNote("");
      setDay("");
      onChanged(`${row.number}: ${t.savedShort}`);
    } catch (err) {
      setError(adminErrorText(err, t.error));
    }
    setBusy(false);
  }

  return (
    <section className="text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {t.followUp}: {t.followUpStatus[f.status ?? "new"]}
        {f.nextFollowUpAt && (
          <span className={`ms-2 rounded-sm px-2 py-0.5 normal-case ${f.due ? "bg-red-50 text-red-700" : "bg-beige text-ink"}`}>
            {f.due ? t.followUpDue : t.nextFollowUp}: {fmtDate(f.nextFollowUpAt)}
          </span>
        )}
      </h3>
      <form onSubmit={save} className="grid gap-2 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
        <label className="block">
          <span className="label">{t.followUp}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
            {Object.entries(t.followUpStatus).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t.noteOptional}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className="field" />
        </label>
        <label className="block">
          <span className="label">{t.nextFollowUp}</span>
          <input type="date" dir="ltr" value={day} onChange={(e) => setDay(e.target.value)} className="field text-start" />
        </label>
        <button type="submit" disabled={busy} className="btn-cta">
          {busy ? t.saving : t.saveFollowUp}
        </button>
      </form>
      {error && <p className="mt-2 text-red-700">{error}</p>}
    </section>
  );
}

type TimelineEntry = { kind: "followUp" | "status"; at: string; by: string | null; title: string; note?: string };

/** Follow-ups and status changes in one list, newest first: who did what, and when. */
function Timeline({ row, tab, t }: { row: Row; tab: OrderTab; t: AdminText }) {
  const [all, setAll] = useState(false);
  const followUps: TimelineEntry[] =
    tab === "sell"
      ? (row.followUp?.history ?? []).map((h: any) => ({
          kind: "followUp",
          at: h.at,
          by: h.by,
          title: h.action === "note" ? t.followUpEntry : `${t.followUp}: ${t.followUpStatus[h.status as keyof AdminText["followUpStatus"]] ?? h.status}`,
          note: h.note,
        }))
      : (row.notes ?? []).map((n: any) => ({ kind: "followUp", at: n.at, by: n.by, title: t.followUpEntry, note: n.note }));
  const statuses: TimelineEntry[] = (row.statusHistory ?? []).map((h: any) => ({
    kind: "status",
    at: h.at,
    by: h.byName ?? null,
    title: fill(t.statusChange, { status: t.status[h.status] ?? h.status }),
    note: h.note,
  }));
  const entries = [...followUps, ...statuses].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  if (!entries.length) return null;
  const shown = all ? entries : entries.slice(0, 6);

  return (
    <section className="text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.history}</h3>
      <ol className="space-y-2 border-s border-border ps-3">
        {shown.map((e, i) => (
          <li key={`${e.kind}-${e.at}-${i}`} className="relative">
            {/* Follow-ups ink, status changes sand */}
            <span aria-hidden className={`absolute -start-[17px] top-1.5 size-2 rounded-full ${e.kind === "followUp" ? "bg-ink" : "bg-sand"}`} />
            <p>
              <span className="font-semibold">{e.title}</span>
              {e.note && <span className="ugc whitespace-pre-line"> · {e.note}</span>}
            </p>
            <p className="text-xs text-muted">
              {e.by ? `${e.by} · ` : ""}
              {fmtDate(e.at, true)}
            </p>
          </li>
        ))}
      </ol>
      {entries.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="mt-2 text-xs font-semibold underline">
          {fill(t.showAll, { n: entries.length })}
        </button>
      )}
    </section>
  );
}

/** Customer photos (moves, technician jobs, sell requests): tap to open full size. */
export function Photos({ photos, t }: { photos?: { url: string; thumbUrl?: string }[]; t: AdminText }) {
  if (!photos?.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm text-muted">
        {t.photosShort} ({photos.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="block size-20 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnails from our own storage */}
            <img src={p.thumbUrl || p.url} alt="" className="size-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    </div>
  );
}
