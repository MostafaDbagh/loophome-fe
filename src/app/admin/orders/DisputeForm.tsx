"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminApiError, adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { sourceTypeForTab, type OrderTab } from "../orderTabs";
import type { Dispute } from "../disputes/types";
import type { Row } from "./RequestPanel";

/** Issues are recorded separately; this never changes fulfilment or financial state. */
export function DisputeForm({ row, tab, onChanged }: { row: Row; tab: OrderTab; onChanged: (message: string) => void }) {
  const { t, lang } = useAdmin();
  const sourceType = sourceTypeForTab(tab);
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const key = `${sourceType}:${row.id}:${lang}:${revision}`;
  const [result, setResult] = useState<{ key: string; existing?: Dispute; error?: string } | null>(null);
  const current = result?.key === key ? result : null;
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ sourceType, sourceId: row.id, status: "open", limit: "1" });
    adminFetch<{ items: Dispute[] }>(`/admin/disputes?${qs}`)
      .then((data) => { if (alive) setResult({ key, existing: data.items[0] }); })
      .catch((err) => { if (alive) setResult({ key, error: adminErrorText(err, t.error) }); });
    return () => { alive = false; };
  }, [sourceType, row.id, key, t.error]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const dispute = await adminFetch<Dispute>("/admin/disputes", { method: "POST", body: JSON.stringify({ sourceType, sourceId: row.id, reason: reason.trim() }) });
      setResult({ key, existing: dispute });
      setFormOpen(false);
      setReason("");
      onChanged(t.disputeSaved);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) {
        setError(t.existingDispute);
        setRevision((n) => n + 1);
      } else setError(adminErrorText(err, t.error));
    } finally { setBusy(false); }
  }

  return <section className="rounded-xl border border-red-200 bg-red-50 p-4">
    <h3 className="flex items-center gap-2 font-bold text-red-900"><TriangleAlert aria-hidden className="size-4 shrink-0" />{t.openDispute}</h3>
    <p className="mt-1 text-xs leading-5 text-red-800">{t.disputeNoFinancialAction}</p>
    {!current ? <p role="status" className="mt-3 text-sm text-muted">{t.loading}</p>
      : current.error ? <div role="alert" className="mt-3 text-sm text-red-700"><p>{current.error}</p><button type="button" onClick={() => setRevision((n) => n + 1)} className="mt-2 font-semibold underline">{t.disputeRetry}</button></div>
      : current.existing ? <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span>{t.existingDispute}</span><Link href={`/admin/disputes?tab=${tab}&status=open&q=${encodeURIComponent(current.existing.number)}`} className="font-semibold underline">{t.viewDispute} · {current.existing.number}</Link></div>
      : <><button type="button" onClick={() => setFormOpen((value) => !value)} aria-expanded={formOpen} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"><TriangleAlert aria-hidden className="size-4 shrink-0" />{t.openDispute}</button>
        {formOpen && <form onSubmit={submit} className="mt-3 space-y-3">
          <label className="block text-sm font-semibold">{t.disputeReason}<textarea required maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.disputeReasonHint} className="field mt-2 min-h-24" /></label>
          <button disabled={busy || !reason.trim()} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? t.loading : t.saveDispute}</button>
        </form>}
      </>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
