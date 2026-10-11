export const LISTED_FILTERS = ["visible", "hidden", "reserved", "sold", "all"] as const;
export type ListedFilter = typeof LISTED_FILTERS[number];
const STATUS_GROUPS: Record<ListedFilter, string[]> = {
  visible: ["active"], hidden: ["archived", "expired"], reserved: ["reserved"], sold: ["sold"],
  all: ["active", "archived", "expired", "reserved", "sold"],
};
export const listedFilter = (value: string | null): ListedFilter => LISTED_FILTERS.includes(value as ListedFilter) ? value as ListedFilter : "visible";
export const listedStatuses = (filter: ListedFilter): string[] => [...STATUS_GROUPS[filter]];

/** Reservation and sale are order states, never visibility toggles. */
export function productVisibilityAction(status: string): "archive" | "publish" | null {
  if (status === "active") return "archive";
  if (["archived", "expired", "draft"].includes(status)) return "publish";
  return null;
}
