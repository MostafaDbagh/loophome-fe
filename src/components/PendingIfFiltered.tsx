/**
 * Static listings (ISR) always ship their unfiltered first page. On a filtered URL this runs before
 * that page is painted and hides it, keeping a fixed space (`.listing-pending`), so the results the
 * browser fetches next replace a blank area instead of a full grid: no flash of the wrong items and
 * no layout shift. Without JS it never runs and the unfiltered page shows. Rendered only in the
 * Suspense fallback, which React replaces on hydration.
 */
export function PendingIfFiltered({ keys }: { keys: readonly string[] }) {
  const js = `(function(s){var q=new URLSearchParams(location.search);if(${JSON.stringify(keys)}.some(function(k){return q.get(k)}))s.parentElement.classList.add("listing-pending")})(document.currentScript)`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

/** The same fixed space, while the browser fetches a filtered page on a first visit. */
export function ListingPlaceholder() {
  return <div aria-busy="true" className="min-h-[60vh]" />;
}
