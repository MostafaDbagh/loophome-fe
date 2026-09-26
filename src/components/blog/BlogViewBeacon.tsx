"use client";

import { useEffect } from "react";

/** Counts an article view from the browser (the page itself is cached). */
export function BlogViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/v1/blog/${encodeURIComponent(slug)}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
