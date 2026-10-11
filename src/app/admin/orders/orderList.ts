/** The API accepts integer pages from 1 through 10,000. */
export function normalizeOrderPage(value: string | null): number {
  const page = Number(value);
  return Number.isFinite(page) && Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

/** Search has the same 100-character limit across every request endpoint. */
export function normalizeOrderSearch(value: string | null): string {
  return (value ?? "").trim().slice(0, 100).trimEnd();
}
