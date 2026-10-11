export const LISTED_FILTERS = ["visible", "hidden", "reserved", "sold", "all"] as const;
export type ListedFilter = typeof LISTED_FILTERS[number];
export const ADMIN_PRODUCT_STATUSES = ["active", "archived", "reserved", "sold"] as const;
export type AdminProductStatus = typeof ADMIN_PRODUCT_STATUSES[number];
const STATUS_GROUPS: Record<ListedFilter, string[]> = {
  visible: ["active"], hidden: ["archived", "expired"], reserved: ["reserved"], sold: ["sold"],
  all: ["active", "archived", "expired", "reserved", "sold"],
};
export const listedFilter = (value: string | null): ListedFilter => LISTED_FILTERS.includes(value as ListedFilter) ? value as ListedFilter : "visible";
export const listedStatuses = (filter: ListedFilter): string[] => [...STATUS_GROUPS[filter]];
export const statusLabelKey = (status: AdminProductStatus) => status === "active" ? "visible" : status === "archived" ? "hidden" : status;
