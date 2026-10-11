export const ITEM_BUCKETS = ["pending", "listed", "buyer", "reserved", "sold", "disputes", "hidden"] as const;
export type ItemBucket = typeof ITEM_BUCKETS[number];
export const ITEM_BUCKET_PATHS: Record<ItemBucket, string> = {
  pending: "/admin/products", listed: "/admin/listed-items", buyer: "/admin/orders?tab=furniture&state=all", reserved: "/admin/reserved-items",
  sold: "/admin/completed-orders?tab=all", disputes: "/admin/disputes?tab=all", hidden: "/admin/products?view=manage&status=archived",
};
export const FIXED_ITEM_STATUSES = { listed: "active", reserved: "reserved" } as const;
export type ProductListView = "catalog" | keyof typeof FIXED_ITEM_STATUSES;
export const isItemManagerQuery = (params: Pick<URLSearchParams, "get" | "has">) =>
  params.get("view") === "manage" || (params.get("view") !== "intake" && (params.has("status") || params.has("q")));
