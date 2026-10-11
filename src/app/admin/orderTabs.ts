/** Order types (sidebar) and which statuses make up each state, per API list. */
export type OrderTab = "sell" | "furniture" | "movers" | "technicians" | "pickup" | "recovery";
export type OrderState = "all" | "pending" | "completed" | "cancelled";
export type OrderBucketState = Exclude<OrderState, "all">;
export type CompletedOrderTab = Exclude<OrderTab, "sell">;
export type CompletedFilterTab = "all" | CompletedOrderTab;
export type CancelledFilterTab = "all" | OrderTab;
export type OrderSourceType = "order" | "sell_request" | "move" | "technician" | "pickup_rental" | "car_recovery";

export const SOLD_ORDER_STATUSES = ["confirmed", "out_for_delivery"] as const;

export const COMPLETED_ORDER_TABS: CompletedOrderTab[] = ["furniture", "movers", "technicians", "pickup", "recovery"];
export const ORDER_SOURCE_TYPES: Record<OrderTab, OrderSourceType> = {
  furniture: "order", sell: "sell_request", movers: "move", technicians: "technician", pickup: "pickup_rental", recovery: "car_recovery",
};

export const sourceTypeForTab = (tab: OrderTab): OrderSourceType => ORDER_SOURCE_TYPES[tab];
export const tabForSourceType = (type: string | null): OrderTab | null =>
  Object.keys(ORDER_SOURCE_TYPES).find((tab) => ORDER_SOURCE_TYPES[tab as OrderTab] === type) as OrderTab | undefined ?? null;

export const ORDER_TABS: Record<OrderTab, { path: string; states: Record<OrderBucketState, string[]> }> = {
  // People selling to us or listing with us; "completed" = collected into stock or live as a listing.
  sell: {
    path: "/admin/sell-requests",
    states: { pending: ["new", "contacted", "agreed", "pickup_scheduled"], completed: ["collected", "listed"], cancelled: ["rejected", "cancelled"] },
  },
  furniture: {
    path: "/admin/orders",
    states: { pending: ["new"], completed: ["delivered"], cancelled: ["cancelled"] },
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
  // Pickup rental (a day with driver and workers) and car recovery (flatbed): same steps as technicians.
  pickup: {
    path: "/admin/pickup-rentals",
    states: { pending: ["new", "contacted", "scheduled"], completed: ["completed"], cancelled: ["rejected", "cancelled"] },
  },
  recovery: {
    path: "/admin/car-recoveries",
    states: { pending: ["new", "contacted", "scheduled"], completed: ["completed"], cancelled: ["rejected", "cancelled"] },
  },
};

export const ORDER_STATES: OrderState[] = ["all", "pending", "completed", "cancelled"];

/** The all filter uses the existing API statuses, including completed and cancelled records. */
export function getOrderStatuses(tab: OrderTab, state: OrderState = "all"): string[] {
  const buckets = ORDER_TABS[tab].states;
  return state === "all" ? [...new Set([...Object.values(buckets).flat(), ...(tab === "furniture" ? SOLD_ORDER_STATUSES : [])])] : [...buckets[state]];
}

/** Regular lists exclude archived outcomes; accepted seller intake remains on its own page. */
export function getActiveOrderStatuses(tab: OrderTab, state: OrderState = "all"): string[] {
  const buckets = ORDER_TABS[tab].states;
  if (state === "cancelled") return [];
  if (state === "completed") return tab === "sell" ? [...buckets.completed] : [];
  if (state === "pending") return [...buckets.pending];
  return tab === "sell" ? [...new Set([...buckets.pending, ...buckets.completed])] : [...buckets.pending];
}

/** Window event: a request changed status, so the sidebar recounts. */
export const REQUESTS_CHANGED = "admin:requests-changed";

export const isTab = (v: string | null): v is OrderTab => !!v && Object.hasOwn(ORDER_TABS, v);
export const isState = (v: string | null): v is OrderState => ORDER_STATES.includes(v as OrderState);
export const isCompletedFilterTab = (v: string | null): v is CompletedFilterTab =>
  v === "all" || COMPLETED_ORDER_TABS.includes(v as CompletedOrderTab);
export const isCancelledFilterTab = (v: string | null): v is CancelledFilterTab => v === "all" || isTab(v);
