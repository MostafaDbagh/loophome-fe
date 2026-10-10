import { ORDER_TABS, type OrderState, type OrderTab } from "../orderTabs";

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
  const state = ["collected", "listed"].includes(request.status ?? "")
    ? "completed"
    : ["rejected", "cancelled"].includes(request.status ?? "")
      ? "cancelled"
      : "pending";
  return `/admin/orders?tab=sell&state=${state}&q=${encodeURIComponent(request.number)}`;
}

/** Terminal workflows stay read-only, including when mixed with active records in the all filter. */
export function canFollowUp(tab: OrderTab, status: string, workflowState?: OrderState): boolean {
  return workflowState !== "completed" && workflowState !== "cancelled" && ORDER_TABS[tab].states.pending.includes(status);
}

function validTimestamp(at: string | null | undefined): at is string {
  return typeof at === "string" && at.trim().length > 0 && Number.isFinite(Date.parse(at));
}

function actor(event: RecordedEvent, team: string): string | null {
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
