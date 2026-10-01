"use client";

import { CheckCircle2, Siren } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { submitJson, type SubmitError } from "@/lib/submit";
import { cityName, UAE_EMIRATES } from "@/lib/ui";
import { Honeypot } from "./FormBits";

/** Today's date in the UAE as YYYY-MM-DD (the API rejects dates before it). */
const todayUAE = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

/** Car recovery (flatbed): the car, where it is, where it goes and when; the price follows on WhatsApp. */
export function CarRecoveryForm() {
  const t = useTranslations("carRecovery");
  const locale = useLocale() as "ar" | "en";
  const [renderedAt, setRenderedAt] = useState(() => Date.now());
  const [date, setDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);

  /** Field label for an API error path such as "from.area". */
  function pathLabel(path: string) {
    const [head, tail] = path.split(".");
    const labels: Record<string, string> = {
      name: t("name"),
      phone: t("phone"),
      vehicle: t("vehicle"),
      from: t("from"),
      to: t("to"),
      city: t("city"),
      area: t("area"),
      address: t("address"),
      date: t("date"),
      urgent: t("urgent"),
      details: t("details"),
    };
    return tail ? `${labels[head] ?? head} – ${labels[tail] ?? tail}` : (labels[head] ?? head);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    const place = (side: "from" | "to") => ({ city: str(`${side}.city`), area: str(`${side}.area`), address: str(`${side}.address`) });
    const body = {
      name: str("name"),
      phone: str("phone"),
      vehicle: str("vehicle"),
      from: place("from"),
      to: place("to"),
      date: str("date"),
      urgent: f.get("urgent") === "on",
      details: str("details"),
      acceptPrivacy: f.get("privacy") === "on",
      _hp: f.get("_hp"),
      _t: renderedAt,
    };
    setSending(true);
    setError(null);
    const result = await submitJson<{ number: string }>(`/api/v1/car-recoveries?lang=${locale}`, body);
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
            setDate("");
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

  // The destination's address is optional: a garage name or area is often all people know yet.
  const placeFields = (side: "from" | "to") => (
    <fieldset className="space-y-3 rounded-xl bg-background p-4">
      <legend className="px-1 font-bold">{t(side)}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("city")}</span>
          <select name={`${side}.city`} required defaultValue="" autoComplete="address-level1" className="field">
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
          <input name={`${side}.area`} required minLength={2} maxLength={60} autoComplete="address-level2" className="field" />
        </label>
      </div>
      <label className="block">
        <span className="label">{t(side === "from" ? "address" : "toAddress")}</span>
        <input
          name={`${side}.address`}
          required={side === "from"}
          minLength={side === "from" ? 3 : undefined}
          maxLength={300}
          placeholder={t(side === "from" ? "addressHint" : "toAddressHint")}
          className="field"
        />
      </label>
    </fieldset>
  );

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
        <label className="block sm:col-span-2">
          <span className="label">{t("vehicle")}</span>
          <input name="vehicle" required minLength={2} maxLength={100} placeholder={t("vehicleHint")} className="field" />
        </label>
      </div>

      {placeFields("from")}
      {placeFields("to")}

      <label className="block sm:max-w-xs">
        <span className="label">{t("date")}</span>
        <input
          name="date"
          type="date"
          required
          min={todayUAE()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          suppressHydrationWarning
          className="field"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
        {/* Urgent means today: fill the date in for them. */}
        <input name="urgent" type="checkbox" onChange={(e) => e.target.checked && setDate(todayUAE())} className="mt-1 size-4 accent-ink" />
        <span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Siren aria-hidden className="size-4" />
            {t("urgent")}
          </span>
          <span className="block text-sm text-muted">{t("urgentHint")}</span>
        </span>
      </label>

      <label className="block">
        <span className="label">{t("details")}</span>
        <textarea name="details" rows={3} maxLength={1000} placeholder={t("detailsHint")} className="field resize-y" />
      </label>

      <p className="rounded-xl bg-beige p-4 text-sm font-semibold">{t("confirmNote")}</p>

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
                  <span className="font-semibold">{pathLabel(d.path)}:</span> {d.message}
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
