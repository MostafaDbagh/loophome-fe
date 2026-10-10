"use client";

import Link from "next/link";
import { Clock3, Package, Phone, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Money } from "@/components/Money";
import type { AdminText } from "../i18n";
import { buildOrderTimeline, furnitureStages, sellRequestHref } from "./orderFlow";
import type { Row } from "./RequestPanel";

export const orderFlowCopy = {
  en: {
    buyer: "Buyer", seller: "Seller", supplier: "Original supplier", listingOwner: "Listing owner",
    stock: "LoopHome stock", stockHelp: "LoopHome owns this item. No original supplier contact is recorded.",
    purchaseHelp: "LoopHome owns this item. The contact below is the original supplier.",
    missingSeller: "Seller details are not recorded for this item.", request: "Open seller request",
    location: "Seller location / collection address", callBuyer: "Call buyer", callSeller: "Call seller",
    whatsappBuyer: "WhatsApp buyer", whatsappSeller: "WhatsApp seller", notRecorded: "Not recorded",
    received: "Order received", delivery: "Delivery to buyer", pickup: "Buyer pickup", flow: "Order progress",
    next: "Next action", current: "Current stage", cancelled: "This order is cancelled. No fulfilment action is required.",
    new: "Contact the buyer to confirm the item, price and delivery or pickup details.",
    confirmedDelivery: "Arrange collection with the seller and delivery to the buyer. Record dispatch when the item leaves.",
    confirmedStock: "Prepare the item from LoopHome stock and arrange delivery to the buyer. Record dispatch when the item leaves.",
    confirmedUnknown: "Confirm where the item is stored, then arrange delivery with the buyer.",
    confirmedPickup: "Prepare the item and agree a pickup time with the buyer. Record completion after collection.",
    out: "Confirm delivery with the buyer, then record the cash collected and complete the order.",
    delivered: "Fulfilment is complete. Review any outstanding seller payment and follow-up notes.",
    payoutNext: "Seller payment is pending. Record it as paid only after the seller receives payment.",
    closed: "Fulfilment and seller payment are complete. Review the history below if a follow-up is needed.",
    paymentStatus: "Payment status", payoutLater: "Calculated after completion", notDue: "Not due for this order",
    totals: "Order payment", commission: "LoopHome commission", payout: "Seller payout", paidAt: "Paid on",
    history: "Order history", historyHelp: "Recorded status changes, notes and seller payment · Dubai time",
    emptyHistory: "No history is recorded yet.", team: "LoopHome team", note: "Note added", created: "Order received",
    paid: "Seller payment recorded", refresh: "Retry loading details", detailError: "Could not load complete order and seller details.",
    loading: "Loading seller details and history…", cancelOrder: "Cancel order", actions: "Update order",
    staffPayout: "An owner admin can record the seller payment.", recordPayment: "Record seller payment",
    paymentHelp: "This records a completed payment; it does not transfer money.", source: "Item source",
  },
  ar: {
    buyer: "المشتري", seller: "البائع", supplier: "المورّد الأصلي", listingOwner: "مالك الإعلان",
    stock: "مخزون لوب هوم", stockHelp: "القطعة مملوكة للوب هوم. لم تُسجّل بيانات المورّد الأصلي.",
    purchaseHelp: "القطعة مملوكة للوب هوم. البيانات أدناه تخص المورّد الأصلي.",
    missingSeller: "لم تُسجّل بيانات البائع لهذه القطعة.", request: "فتح طلب البائع",
    location: "موقع البائع / عنوان الاستلام", callBuyer: "اتصال بالمشتري", callSeller: "اتصال بالبائع",
    whatsappBuyer: "واتساب المشتري", whatsappSeller: "واتساب البائع", notRecorded: "غير مسجّل",
    received: "تاريخ الطلب", delivery: "توصيل للمشتري", pickup: "استلام المشتري", flow: "مراحل الطلب",
    next: "الخطوة التالية", current: "المرحلة الحالية", cancelled: "هذا الطلب ملغى. لا توجد خطوة تسليم مطلوبة.",
    new: "تواصل مع المشتري لتأكيد القطعة والسعر وبيانات التوصيل أو الاستلام.",
    confirmedDelivery: "نسّق استلام القطعة من البائع وتوصيلها للمشتري. سجّل خروجها للتوصيل عند إرسالها.",
    confirmedStock: "جهّز القطعة من مخزون لوب هوم ونسّق توصيلها للمشتري. سجّل خروجها للتوصيل عند إرسالها.",
    confirmedUnknown: "تحقّق من مكان القطعة، ثم نسّق توصيلها مع المشتري.",
    confirmedPickup: "جهّز القطعة واتفق مع المشتري على موعد الاستلام. سجّل اكتمال الطلب بعد الاستلام.",
    out: "أكّد التسليم مع المشتري، ثم سجّل المبلغ المحصّل وأكمل الطلب.",
    delivered: "اكتمل التسليم. راجع مستحقات البائع وملاحظات المتابعة.",
    payoutNext: "مستحقات البائع بانتظار الدفع. سجّلها كمدفوعة فقط بعد استلام البائع للمبلغ.",
    closed: "اكتمل التسليم ودفع مستحقات البائع. راجع السجل أدناه عند الحاجة للمتابعة.",
    paymentStatus: "حالة الدفع", payoutLater: "تُحسب بعد اكتمال الطلب", notDue: "لا توجد دفعة مستحقة لهذا الطلب",
    totals: "مبالغ الطلب", commission: "عمولة لوب هوم", payout: "مستحقات البائع", paidAt: "تاريخ الدفع",
    history: "سجل الطلب", historyHelp: "تغييرات الحالة والملاحظات ودفع مستحقات البائع المسجّلة · توقيت دبي",
    emptyHistory: "لا توجد أحداث مسجّلة بعد.", team: "فريق لوب هوم", note: "إضافة ملاحظة", created: "استلام الطلب",
    paid: "تسجيل دفع مستحقات البائع", refresh: "إعادة تحميل التفاصيل", detailError: "تعذّر تحميل تفاصيل الطلب والبائع كاملة.",
    loading: "جارٍ تحميل بيانات البائع وسجل الطلب…", cancelOrder: "إلغاء الطلب", actions: "تحديث الطلب",
    staffPayout: "يمكن لمسؤول بصلاحية المالك تسجيل دفع مستحقات البائع.", recordPayment: "تسجيل دفع مستحقات البائع",
    paymentHelp: "هذا يسجّل دفعة تمت بالفعل؛ ولا يحوّل الأموال.", source: "مصدر القطعة",
  },
} as const;

const orderDate = (date?: string | null) => date && Number.isFinite(Date.parse(date))
  ? new Date(date).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="ugc mt-1 break-words font-medium">{children}</dd></div>;
}

function Contact({ phone, whatsappUrl, buyer, lang }: { phone?: string; whatsappUrl?: string; buyer?: boolean; lang: "en" | "ar" }) {
  const c = orderFlowCopy[lang];
  return <div className="mt-3 flex flex-wrap gap-2">
    {phone && <a href={`tel:${phone}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-beige"><Phone aria-hidden className="size-3.5" />{buyer ? c.callBuyer : c.callSeller}</a>}
    {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-beige"><WhatsAppIcon className="size-4 text-whatsapp-dark" />{buyer ? c.whatsappBuyer : c.whatsappSeller}</a>}
  </div>;
}

export function FurnitureOrderDetails({ row, t, lang, loaded, failed }: { row: Row; t: AdminText; lang: "en" | "ar"; loaded: boolean; failed: boolean }) {
  const c = orderFlowCopy[lang];
  const seller = row.seller;
  const source = row.inventorySource;
  const money = (amount: number) => <Money amount={amount} currency={row.currency ?? "AED"} locale={lang} />;
  const address = [row.customer?.address, row.customer?.area, row.customer?.city].filter(Boolean).join(lang === "ar" ? "، " : ", ");
  const sellerLocation = seller && [seller.pickupAddress, seller.area, seller.city].filter(Boolean).join(lang === "ar" ? "، " : ", ");

  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-beige/60 p-4">
      <div className="min-w-0"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><Package aria-hidden className="size-4" />{t.item}<span dir="ltr">{row.item?.ref || "—"}</span></p><h3 className="ugc mt-1 text-lg font-bold">{row.item?.title || c.notRecorded}</h3><p className="mt-1 text-sm text-muted">{row.fulfilment === "pickup" ? c.pickup : c.delivery}</p></div>
      <div className="text-sm"><p className="text-xs text-muted">{c.received}</p><p dir="ltr" className="mt-1 font-medium">{orderDate(row.createdAt)}</p></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-xl border border-border p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><UserRound aria-hidden className="size-4" />{c.buyer}</h3>
        <p className="ugc text-lg font-semibold"><bdi>{row.customer?.name || c.notRecorded}</bdi></p>
        <p dir="ltr" className="mt-1 text-start text-sm">{row.customer?.phone || c.notRecorded}</p>
        <dl className="mt-3 space-y-3 text-sm"><Detail label={row.fulfilment === "pickup" ? t.pickup : t.address}>{row.fulfilment === "pickup" ? t.pickupWarehouse : address || c.notRecorded}</Detail>{row.customer?.notes && <Detail label={t.customerMessage}>{row.customer.notes}</Detail>}</dl>
        <Contact buyer phone={row.customer?.phone} whatsappUrl={row.whatsappUrl} lang={lang} />
      </section>
      <section className="min-w-0 rounded-xl border border-border p-4">
        <h3 className="mb-3 flex flex-wrap items-center gap-2 font-bold"><UserRound aria-hidden className="size-4" />{c.seller}{loaded && source && <span className="rounded-full bg-beige px-2 py-1 text-xs font-medium">{source === "consignment" ? c.listingOwner : c.stock}</span>}</h3>
        {!loaded ? <p role="status" className="text-sm text-muted">{failed ? c.detailError : c.loading}</p> : seller ? <>
          {source === "purchase" && <p className="mb-3 text-xs leading-relaxed text-muted">{c.purchaseHelp}</p>}
          {source === "purchase" && <p className="mb-1 text-xs text-muted">{c.supplier}</p>}
          <p className="ugc text-lg font-semibold"><bdi>{seller.name || c.notRecorded}</bdi></p><p dir="ltr" className="mt-1 text-start text-sm">{seller.phone || c.notRecorded}</p>
          {sellerLocation && <dl className="mt-3 text-sm"><Detail label={c.location}>{sellerLocation}</Detail></dl>}
          <Contact phone={seller.phone} whatsappUrl={seller.whatsappUrl} lang={lang} />
          {seller.sellRequest && <Link href={sellRequestHref(seller.sellRequest)} className="mt-3 inline-flex min-h-10 flex-wrap items-center gap-2 text-sm font-semibold underline underline-offset-4">{c.request}<span dir="ltr">{seller.sellRequest.number}</span></Link>}
          {source === "consignment" && <dl className="mt-4 grid gap-3 border-t border-border pt-3 text-sm sm:grid-cols-2">
            {seller.commissionPercent != null && <Detail label={c.commission}><span dir="ltr">{seller.commissionPercent}%</span></Detail>}
            <Detail label={c.payout}>{seller.payout != null ? money(seller.payout) : row.status === "cancelled" ? c.notDue : c.payoutLater}</Detail>
            <Detail label={c.paymentStatus}>{seller.payoutStatus === "none" ? c.notDue : t.payoutStatus[seller.payoutStatus as keyof AdminText["payoutStatus"]] ?? c.notRecorded}</Detail>
            {seller.paidAt && <Detail label={c.paidAt}><span dir="ltr">{orderDate(seller.paidAt)}</span></Detail>}
          </dl>}
        </> : <p className="text-sm leading-relaxed text-muted">{source === "direct" ? c.stockHelp : c.missingSeller}</p>}
      </section>
    </div>

    <section className="rounded-xl border border-border p-4">
      <h3 className="mb-3 font-bold">{c.totals}</h3><dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <Detail label={t.price}>{money(row.price ?? 0)}</Detail><Detail label={t.delivery}>{money(row.deliveryFee ?? 0)}</Detail>
        {row.services?.length > 0 && <Detail label={t.services}>{row.services.map((s: { key: string; name?: Record<string, string>; fee?: number }) => <p key={s.key}>{s.name?.[lang] ?? s.key} · {money(s.fee ?? 0)}</p>)}</Detail>}
        <Detail label={t.total_}><span className="text-lg font-bold">{money(row.total ?? 0)}</span></Detail>
        <Detail label={t.cashCollected}>{row.cashCollected != null ? money(row.cashCollected) : c.notRecorded}</Detail>
      </dl>
      {row.adminNotes && <dl className="mt-3 border-t border-border pt-3 text-sm"><Detail label={t.internalNote}>{row.adminNotes}</Detail></dl>}
      {row.cancelReason && <dl className="mt-3 border-t border-border pt-3 text-sm"><Detail label={t.reason}>{row.cancelReason}</Detail></dl>}
    </section>
  </div>;
}

export function OrderProgress({ row, t, lang }: { row: Row; t: AdminText; lang: "en" | "ar" }) {
  const c = orderFlowCopy[lang];
  const stages = furnitureStages(row.fulfilment);
  const next = row.status === "cancelled" ? c.cancelled : row.status === "new" ? c.new
    : row.status === "confirmed" ? row.fulfilment === "pickup" ? c.confirmedPickup : row.inventorySource === "consignment" ? c.confirmedDelivery : row.inventorySource === "direct" || row.inventorySource === "purchase" ? c.confirmedStock : c.confirmedUnknown
    : row.status === "out_for_delivery" ? c.out : row.seller?.payoutStatus === "pending" ? c.payoutNext
    : row.seller?.payoutStatus === "paid" ? c.closed : c.delivered;
  return <section aria-label={c.flow} className="rounded-xl border border-border bg-beige/40 p-4">
    <h3 className="font-bold">{c.flow}</h3>
    <ol className={`mt-3 grid gap-2 ${stages.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
      {stages.map((status, i) => <li key={status} aria-current={status === row.status ? "step" : undefined} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${status === row.status ? "border-ink bg-ink font-bold text-white" : "border-border bg-surface text-muted"}`}><span className="grid size-6 shrink-0 place-items-center rounded-full border border-current/30">{i + 1}</span>{status === "delivered" && row.fulfilment === "pickup" ? t.pickup : t.status[status] ?? status}{status === row.status && <span className="sr-only">{c.current}</span>}</li>)}
    </ol>
    <p className="mt-3 text-sm leading-relaxed"><span className="font-bold">{c.next}: </span>{next}</p>
  </section>;
}

export function FurnitureHistory({ row, t, lang }: { row: Row; t: AdminText; lang: "en" | "ar" }) {
  const [all, setAll] = useState(false);
  const c = orderFlowCopy[lang];
  const entries = buildOrderTimeline({ createdAt: row.createdAt, statusHistory: row.statusHistory, notes: row.notes, seller: row.seller }, { statuses: t.status, statusChange: (s) => s, note: c.note, created: c.created, payout: c.paid, team: c.team });
  const shown = all ? entries : entries.slice(0, 6);
  return <section className="rounded-xl border border-border p-4 text-sm">
    <h3 className="flex items-center gap-2 font-bold"><Clock3 aria-hidden className="size-4" />{c.history}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{c.historyHelp}</p>
    {shown.length ? <ol className="mt-4 space-y-4 border-s border-border ps-4">{shown.map((event) => <li key={event.id} className="relative"><span aria-hidden className={`absolute -start-[21px] top-1.5 size-2 rounded-full ${event.kind === "payout" ? "bg-green-600" : event.kind === "note" ? "bg-ink" : "bg-sand"}`} /><p className="font-semibold">{event.title}</p>{event.note && <p className="ugc mt-1 whitespace-pre-line break-words text-muted">{event.note}</p>}<p className="mt-1 text-xs text-muted">{event.by && <><bdi>{event.by}</bdi> · </>}<time dateTime={event.at} dir="ltr">{orderDate(event.at)}</time></p></li>)}</ol> : <p className="mt-3 text-muted">{c.emptyHistory}</p>}
    {entries.length > 6 && <button type="button" onClick={() => setAll(!all)} className="mt-4 min-h-9 text-xs font-semibold underline">{all ? (lang === "ar" ? "إظهار أحدث الأحداث" : "Show latest events") : t.showAll.replace("{n}", String(entries.length))}</button>}
  </section>;
}
