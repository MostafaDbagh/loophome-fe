export const ITEM_BUCKETS = ["pending", "listed", "reserved", "sold", "disputed", "hidden"] as const;
export type ItemBucket = typeof ITEM_BUCKETS[number];
export const ITEM_BUCKET_PATHS: Record<ItemBucket, string> = {
  pending: "/admin/products", listed: "/admin/listed-items", reserved: "/admin/reserved-items",
  sold: "/admin/sold-items", disputed: "/admin/item-problems", hidden: "/admin/products?view=manage&status=archived",
};
export const FIXED_ITEM_STATUSES = { listed: "active", reserved: "reserved", sold: "sold", disputed: "disputed" } as const;
export type ProductListView = "catalog" | keyof typeof FIXED_ITEM_STATUSES;
export const isItemManagerQuery = (params: Pick<URLSearchParams, "get" | "has">) =>
  params.get("view") === "manage" || (params.get("view") !== "intake" && (params.has("status") || params.has("q")));
