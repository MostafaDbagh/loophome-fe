"use client";

import { useEffect } from "react";

/**
 * Counts a product view from the visitor's browser. Product pages are cached (ISR), so
 * the server-side fetch can't tell visitors apart; the API dedupes per visitor per day.
 */
export function ViewBeacon({ productId }: { productId: string }) {
  useEffect(() => {
    fetch(`/api/v1/products/${productId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [productId]);
  return null;
}
