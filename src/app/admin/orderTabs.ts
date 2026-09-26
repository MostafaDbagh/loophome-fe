/** Order types (sidebar) and which statuses make up each state, per API list. */
export type OrderTab = "furniture" | "movers" | "technicians";
export type OrderState = "pending" | "completed" | "cancelled";

export const ORDER_TABS: Record<OrderTab, { path: string; states: Record<OrderState, string[]> }> = {
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

export const ORDER_STATES: OrderState[] = ["pending", "completed", "cancelled"];
export const isTab = (v: string | null): v is OrderTab => !!v && v in ORDER_TABS;
export const isState = (v: string | null): v is OrderState => ORDER_STATES.includes(v as OrderState);
