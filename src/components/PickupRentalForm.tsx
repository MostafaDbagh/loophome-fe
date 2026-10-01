"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { PublicSettings } from "@/lib/api";
import { submitJson, type SubmitError } from "@/lib/submit";
import { cityName, UAE_EMIRATES } from "@/lib/ui";
import { Honeypot } from "./FormBits";
import { Money } from "./Money";

type PickupRental = NonNullable<PublicSettings["pickupRental"]>;

/** Today's date in the UAE as YYYY-MM-DD (the API rejects dates before it). */
const todayUAE = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

/** Pickup with a driver for the admin's block of hours: date, address and 1..maxWorkers workers, with the estimated total as they pick. */
export function PickupRentalForm({ rental }: { rental: PickupRental }) {
  const t = useTranslations("pickupRental");
  const locale = useLocale() as "ar" | "en";
  const [renderedAt, setRenderedAt] = useState(() => Date.now());
  const [workers, setWorkers] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);
  const counts = Array.from({ length: Math.max(1, rental.maxWorkers) }, (_, i) => i + 1);
  const money = (amount: number) => <Money amount={amount} currency={rental.currency} locale={locale} />;

  const labels: Record<string, string> = {
    name: t("name"),
    phone: t("phone"),
    city: t("city"),
    area: t("area"),
    address: t("address"),
    date: t("date"),
    workers: t("workers"),
    details: t("details"),
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    const body = {
      name: str("name"),
      phone: str("phone"),
      city: str("city"),
      area: str("area"),
      address: str("address"),
      date: str("date"),
      workers,
      details: str("details"),
      acceptPrivacy: f.get("privacy") === "on",
      _hp: f.get("_hp"),
      _t: renderedAt,
    };
    setSending(true);
    setError(null);
    const result = await submitJson<{ number: string }>(`/api/v1/pickup-rentals?lang=${locale}`, body);
    setSending(false);
    if (result.ok) {
      setDone(result.data);
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
    } else setError(result.error);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-14 text-ink" />
        <h2 className="mt-4 text-2xl font-extrabold">{t("successTitle")}</h2>
        <p className="mt-2 text-muted">{t("successText", { number: done.number })}</p>
        <button
          type="button"
          onClick={() => {
            setWorkers(1);
            setDone(null);
            setRenderedAt(Date.now());
          }}
          className="btn-cta mt-6"
        >
          {t("another")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-6 rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <h2 className="text-2xl font-extrabold">{t("formTitle")}</h2>
      <Honeypot />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("name")}</span>
          <input name="name" required minLength={2} maxLength={60} autoComplete="name" className="field" />
        </label>
        <label className="block">
          <span className="label">{t("phone")}</span>
          <input name="phone" type="tel" required dir="ltr" autoComplete="tel" placeholder="050 123 4567" className="field text-start" />
        </label>
        <label className="block">
          <span className="label">{t("city")}</span>
          <select name="city" required defaultValue="" autoComplete="address-level1" className="field">
            <option value="" disabled />
            {UAE_EMIRATES.en.map((c) => (
              <option key={c} value={c}>
                {cityName(c, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t("area")}</span>
          <input name="area" required minLength={2} maxLength={60} autoComplete="address-level2" className="field" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">{t("address")}</span>
          <input name="address" required minLength={3} maxLength={300} autoComplete="street-address" placeholder={t("addressHint")} className="field" />
        </label>
        <label className="block">
          <span className="label">{t("date")}</span>
          <input name="date" type="date" required min={todayUAE()} suppressHydrationWarning className="field" />
        </label>
      </div>

      <fieldset>
        <legend className="label">{t("workers")}</legend>
        <div role="radiogroup" aria-label={t("workers")} className="flex flex-wrap gap-1.5">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={workers === n}
              onClick={() => setWorkers(n)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                workers === n ? "border-ink bg-ink text-white" : "border-border hover:border-ink/40"
              }`}
            >
              {t("workerCount", { count: n })}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-sm text-muted">{t.rich("perWorker", { amount: () => money(rental.workerPrice) })}</p>
      </fieldset>

      <label className="block">
        <span className="label">{t("details")}</span>
        <textarea name="details" rows={3} maxLength={1000} placeholder={t("detailsHint")} className="field resize-y" />
        <span className="mt-1.5 block text-sm text-muted">{t("longer", { hours: rental.hours })}</span>
      </label>

      {/* Base price (pickup with driver for `hours`) + workers × worker price; without a base price the team quotes it. */}
      <div aria-live="polite" className="rounded-xl bg-beige p-4">
        {rental.basePrice != null && (
          <>
            <p className="text-lg font-extrabold">{t.rich("total", { amount: () => money(rental.basePrice! + workers * rental.workerPrice) })}</p>
            <p className="mt-0.5 text-sm text-ink/70">
              {t.rich("totalBreakdown", {
                hours: rental.hours,
                count: workers,
                base: () => money(rental.basePrice!),
                worker: () => money(rental.workerPrice),
              })}
            </p>
          </>
        )}
        <p className={`text-sm ${rental.basePrice != null ? "mt-2 text-muted" : "font-semibold"}`}>{t("confirmNote")}</p>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input name="privacy" type="checkbox" required className="mt-0.5 size-4 accent-ink" />
        <span>
          {t.rich("privacy", {
            privacy: (chunks) => (
              <Link href="/privacy" target="_blank" className="font-semibold underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">{error.message || t("error")}</p>
          {error.details?.length ? (
            <ul className="mt-1 list-disc ps-5">
              {error.details.map((d) => (
                <li key={`${d.path}-${d.message}`}>
                  <span className="font-semibold">{labels[d.path] ?? d.path}:</span> {d.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <button type="submit" disabled={sending} className="btn-cta w-full py-3.5! text-lg">
        {sending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
