/** Order types (sidebar) and which statuses make up each state, per API list. */
export type OrderTab = "sell" | "furniture" | "movers" | "technicians" | "pickup" | "recovery";
export type OrderState = "pending" | "completed" | "cancelled";

export const ORDER_TABS: Record<OrderTab, { path: string; states: Record<OrderState, string[]> }> = {
  // People selling to us or listing with us; "completed" = collected into stock or live as a listing.
  sell: {
    path: "/admin/sell-requests",
    states: { pending: ["new", "contacted", "agreed", "pickup_scheduled"], completed: ["collected", "listed"], cancelled: ["rejected", "cancelled"] },
  },
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

export const ORDER_STATES: OrderState[] = ["pending", "completed", "cancelled"];

/** Window event: a request changed status, so the sidebar recounts. */
export const REQUESTS_CHANGED = "admin:requests-changed";

export const isTab = (v: string | null): v is OrderTab => !!v && v in ORDER_TABS;
export const isState = (v: string | null): v is OrderState => ORDER_STATES.includes(v as OrderState);
