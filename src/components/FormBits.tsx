import type { SubmitError } from "@/lib/submit";

/** Hidden field people never fill; the API treats a filled one as a bot. */
export function Honeypot() {
  return (
    <input
      name="_hp"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute -start-[9999px] size-px opacity-0"
      defaultValue=""
    />
  );
}

/** Server message (already localized by the API) plus field details, or a generic fallback. */
export function FormErrors({ error, fallback }: { error: SubmitError | null; fallback: string }) {
  if (!error) return null;
  const details = error.details?.map((d) => d.message) ?? [];
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="font-semibold">{error.code === "PRODUCT_UNAVAILABLE" || !error.message ? fallback : error.message}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-disc ps-5">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
