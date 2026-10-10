/** Inclusive last N Dubai calendar days, in the API's YYYY-MM-DD format. */
export function overviewRange(days: number, now = new Date()): { from: string; to: string } {
  if (!Number.isInteger(days) || days < 1) throw new RangeError("Days must be a positive integer.");

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const to = `${parts.year}-${parts.month}-${parts.day}`;
  // Use UTC only for calendar arithmetic, after selecting the Dubai calendar date.
  const firstDay = new Date(`${to}T00:00:00.000Z`);
  firstDay.setUTCDate(firstDay.getUTCDate() - (days - 1));
  return { from: firstDay.toISOString().slice(0, 10), to };
}
