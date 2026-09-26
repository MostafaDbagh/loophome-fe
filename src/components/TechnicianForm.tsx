"use client";

import { Check, CheckCircle2, Siren } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { PublicSettings } from "@/lib/api";
import { submitForm, submitJson, type SubmitError } from "@/lib/submit";
import { UAE_EMIRATES } from "@/lib/ui";
import { Honeypot } from "./FormBits";
import { PhotoPicker, toFormData, type PickedPhoto } from "./PhotoPicker";

type Technician = NonNullable<PublicSettings["technician"]>;
const TIMES = ["anytime", "morning", "afternoon", "evening"] as const;

const todayUAE = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

export function TechnicianForm({ technician }: { technician: Technician }) {
  const t = useTranslations("technician");
  const locale = useLocale() as "ar" | "en";
  const [renderedAt, setRenderedAt] = useState(() => Date.now());
  const [serviceType, setServiceType] = useState(technician.types[0]?.key ?? "");
  const [time, setTime] = useState<(typeof TIMES)[number]>("anytime");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);

  const labels: Record<string, string> = {
    serviceType: t("serviceType"),
    description: t("jobDescription"),
    name: t("name"),
    phone: t("phone"),
    city: t("city"),
    area: t("area"),
    address: t("address"),
    preferredDate: t("preferredDate"),
    preferredTime: t("preferredTime"),
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    const body = {
      serviceType,
      description: str("description"),
      name: str("name"),
      phone: str("phone"),
      city: str("city"),
      area: str("area"),
      address: str("address"),
      preferredDate: str("preferredDate"),
      preferredTime: time,
      urgent: f.get("urgent") === "on",
      acceptPrivacy: f.get("privacy") === "on",
      _hp: f.get("_hp"),
      _t: renderedAt,
    };
    setSending(true);
    setError(null);
    const url = `/api/v1/technician-requests?lang=${locale}`;
    const result = photos.length
      ? await submitForm<{ number: string }>(url, toFormData(body, photos))
      : await submitJson<{ number: string }>(url, body);
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
            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setPhotos([]);
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

      <fieldset>
        <legend className="label">{t("serviceType")}</legend>
        <div role="radiogroup" aria-label={t("serviceType")} className="grid gap-2 sm:grid-cols-2">
          {technician.types.map((type) => {
            const active = serviceType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setServiceType(type.key)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-start transition ${
                  active ? "border-ink bg-beige ring-1 ring-ink" : "border-border hover:border-ink/40"
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${active ? "border-ink bg-ink text-white" : "border-ink/30"}`}>
                  {active && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{type.name}</span>
                  <span className="block text-xs text-muted">{type.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="label">{t("jobDescription")}</span>
        <textarea name="description" required minLength={10} maxLength={2000} rows={3} placeholder={t("jobHint")} className="field resize-y" />
      </label>

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
            {UAE_EMIRATES[locale].map((c) => (
              <option key={c}>{c}</option>
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
          <span className="label">{t("preferredDate")}</span>
          <input name="preferredDate" type="date" required min={todayUAE()} suppressHydrationWarning className="field" />
        </label>
        <fieldset>
          <legend className="label">{t("preferredTime")}</legend>
          <div role="radiogroup" aria-label={t("preferredTime")} className="grid grid-cols-2 gap-1.5">
            {TIMES.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={time === k}
                onClick={() => setTime(k)}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                  time === k ? "border-ink bg-ink text-white" : "border-border hover:border-ink/40"
                }`}
              >
                {t(k)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
        <input name="urgent" type="checkbox" className="mt-1 size-4 accent-ink" />
        <span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Siren aria-hidden className="size-4" />
            {t("urgent")}
          </span>
          <span className="block text-sm text-muted">{t("urgentHint")}</span>
        </span>
      </label>

      <PhotoPicker photos={photos} onChange={setPhotos} label={t("photos")} hint={t("photosHint")} />

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

      <button type="submit" disabled={sending || !serviceType} className="btn-cta w-full py-3.5! text-lg">
        {sending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
