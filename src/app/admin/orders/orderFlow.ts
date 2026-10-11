import { ORDER_TABS, tabForSourceType, type CancelledFilterTab, type CompletedFilterTab, type OrderState, type OrderTab } from "../orderTabs";
import { normalizeOrderPage, normalizeOrderSearch } from "./orderList";

type RecordedEvent = {
  at?: string | null;
  by?: string | null;
  byName?: string | null;
  note?: string;
};

export type OrderTimelineRow = {
  createdAt?: string | null;
  statusHistory?: (RecordedEvent & { status: string })[];
  notes?: (RecordedEvent & { id?: string })[];
  seller?: { payoutStatus?: string; paidAt?: string | null };
};

export type OrderTimelineLabels = {
  statuses: Record<string, string>;
  statusChange: (status: string) => string;
  note: string;
  created: string;
  payout: string;
  team: string;
};

export type OrderTimelineEntry = {
  id: string;
  kind: "created" | "status" | "note" | "payout";
  at: string;
  by: string | null;
  title: string;
  note?: string;
};

/** Open the seller request in the state that actually contains its status. */
export function sellRequestHref(request: { number: string; status?: string }): string {
  if (["rejected", "cancelled"].includes(request.status ?? "")) return cancelledOrderHref("sell", { q: request.number });
  const state = ["collected", "listed"].includes(request.status ?? "")
    ? "completed"
    : "pending";
  return `/admin/orders?tab=sell&state=${state}&q=${encodeURIComponent(request.number)}`;
}

export type CompletedOrderLinkOptions = { q?: string; page?: number; payoutStatus?: "pending" | "paid" };
export type CancelledOrderLinkOptions = { q?: string; page?: number };

/** Rejected and cancelled requests of every source type share one archive. */
export function cancelledOrderHref(tab: CancelledFilterTab = "all", options: CancelledOrderLinkOptions = {}): string {
  const params = new URLSearchParams({ tab });
  const q = normalizeOrderSearch(options.q ?? null);
  const page = normalizeOrderPage(options.page == null ? null : String(options.page));
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return `/admin/cancelled-orders?${params}`;
}

/** A completed buyer order can still require seller payout; an all-services payout filter is buyer-only. */
export function completedOrderHref(tab: CompletedFilterTab = "all", options: CompletedOrderLinkOptions = {}): string {
  const params = new URLSearchParams({ tab });
  const q = normalizeOrderSearch(options.q ?? null);
  const page = normalizeOrderPage(options.page == null ? null : String(options.page));
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  if ((tab === "all" || tab === "furniture") && options.payoutStatus) params.set("payoutStatus", options.payoutStatus);
  return `/admin/completed-orders?${params}`;
}

/** Accepted seller intake is separate from completed buyer fulfilment and service jobs. */
export function orderRecordHref(tab: OrderTab, request: { number: string; status?: string }): string {
  if (tab === "sell") return sellRequestHref(request);
  const buckets = ORDER_TABS[tab].states;
  if (buckets.completed.includes(request.status ?? "")) return completedOrderHref(tab, { q: request.number });
  if (buckets.cancelled.includes(request.status ?? "")) return cancelledOrderHref(tab, { q: request.number });
  const params = new URLSearchParams({ tab, state: "pending", q: normalizeOrderSearch(request.number) });
  return `/admin/orders?${params}`;
}

/** Use the dispute's real target type and lifecycle, and do not link a removed target. */
export function disputeSourceHref(source: { type: string; number: string; status?: string; exists?: boolean }): string | null {
  const tab = tabForSourceType(source.type);
  return source.exists === false || !tab || !source.number.trim() ? null : orderRecordHref(tab, source);
}

/** Terminal workflows stay read-only, including when mixed with active records in the all filter. */
export function canFollowUp(tab: OrderTab, status: string, workflowState?: OrderState): boolean {
  return workflowState !== "completed" && workflowState !== "cancelled" && ORDER_TABS[tab].states.pending.includes(status);
}

export type CancellationReasonRow = {
  status: string;
  cancelReason?: string | null;
  rejectReason?: string | null;
  statusHistory?: { status: string; at?: string | null; note?: string | null }[];
};

/** Reason fields survive reopening, so only the current cancelled or rejected outcome applies. */
export function currentCancellationReason(row: CancellationReasonRow): string | null {
  if (row.status !== "cancelled" && row.status !== "rejected") return null;
  let latestAt = -Infinity;
  let latestNote: string | null | undefined;
  for (const event of row.statusHistory ?? []) {
    if (event.status !== row.status || !validTimestamp(event.at)) continue;
    const at = Date.parse(event.at);
    if (at >= latestAt) { latestAt = at; latestNote = event.note; }
  }
  const recordedReason = row.status === "cancelled" ? row.cancelReason : row.rejectReason;
  return latestNote?.trim() || recordedReason?.trim() || null;
}

export function validTimestamp(at: string | null | undefined): at is string {
  return typeof at === "string" && at.trim().length > 0 && Number.isFinite(Date.parse(at));
}

export function actor(event: RecordedEvent, team: string): string | null {
  const name = event.byName?.trim() || event.by?.trim();
  if (!name) return null;
  return /^[a-f\d]{24}$/i.test(name) ? team : name;
}

/** Recorded order events, newest first; the current status alone is not an event. */
export function buildOrderTimeline(row: OrderTimelineRow, labels: OrderTimelineLabels): OrderTimelineEntry[] {
  const entries: OrderTimelineEntry[] = [];
  let hasCreationStatus = false;

  (row.statusHistory ?? []).forEach((event, index) => {
    if (!validTimestamp(event.at)) return;
    if (event.status === "new") hasCreationStatus = true;
    entries.push({
      id: `status-${index}-${event.at}`,
      kind: "status",
      at: event.at,
      by: actor(event, labels.team),
      title: labels.statusChange(labels.statuses[event.status] ?? event.status),
      ...(event.note ? { note: event.note } : {}),
    });
  });

  (row.notes ?? []).forEach((event, index) => {
    if (!validTimestamp(event.at)) return;
    entries.push({
      id: `note-${event.id ?? index}-${index}-${event.at}`,
      kind: "note",
      at: event.at,
      by: actor(event, labels.team),
      title: labels.note,
      ...(event.note ? { note: event.note } : {}),
    });
  });

  if (!hasCreationStatus && validTimestamp(row.createdAt)) {
    entries.push({ id: `created-${row.createdAt}`, kind: "created", at: row.createdAt, by: null, title: labels.created });
  }

  if (row.seller?.payoutStatus === "paid" && validTimestamp(row.seller.paidAt)) {
    entries.push({ id: `payout-${row.seller.paidAt}`, kind: "payout", at: row.seller.paidAt, by: null, title: labels.payout });
  }

  return entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function furnitureStages(fulfilment?: string): string[] {
  return fulfilment === "pickup"
    ? ["new", "confirmed", "delivered"]
    : ["new", "confirmed", "out_for_delivery", "delivered"];
}
