export const ADMIN_PRODUCT_STATUSES = ["active", "archived", "reserved", "sold"] as const;
export type AdminProductStatus = typeof ADMIN_PRODUCT_STATUSES[number];
export const statusLabelKey = (status: AdminProductStatus) => status === "active" ? "visible" : status === "archived" ? "hidden" : status;
