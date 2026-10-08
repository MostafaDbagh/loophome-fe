import type { PublicSettings } from "@/lib/api";

/** Public terms must come from the same settings as the submission form. */
export function listingTerms(settings: PublicSettings | null) {
  const listing = settings?.listing;
  if (settings?.listWithUs?.enabled === false || !listing) return null;
  const { days, commissionPercent } = listing;
  if (!Number.isInteger(days) || days <= 0 || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) return null;
  const examplePrice = 1000;
  const exampleCommission = Math.round(examplePrice * commissionPercent) / 100;
  return { days, commissionPercent, examplePrice, exampleCommission, exampleProceeds: examplePrice - exampleCommission };
}
