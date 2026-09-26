"use client";

import { Building2, Camera, Check, CheckCircle2, Home, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { PublicSettings } from "@/lib/api";
import { submitForm, submitJson, type SubmitError } from "@/lib/submit";
import { UAE_EMIRATES } from "@/lib/ui";
import { Honeypot } from "./FormBits";
import { Link } from "@/i18n/navigation";

type Kind = "office" | "home";
type Moving = NonNullable<PublicSettings["moving"]>;

const MAX_PHOTOS = 10;
const MAX_BYTES = 8 * 1024 * 1024;

/** Today's date in the UAE as YYYY-MM-DD (the API rejects visit dates before it). */
const todayUAE = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

export function MovingForm({ moving }: { moving: Moving }) {
  const t = useTranslations("moving");
  const locale = useLocale() as "ar" | "en";
  const fileInput = useRef<HTMLInputElement>(null);
  const [renderedAt, setRenderedAt] = useState(() => Date.now());
  const [kind, setKind] = useState<Kind>("home");
  const [services, setServices] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [visitDate, setVisitDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);
  const today = todayUAE();

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = [...list]
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES)
      .slice(0, MAX_PHOTOS - photos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...picked]);
    if (fileInput.current) fileInput.current.value = "";
  }

  /** Field label for an API error path such as "from.address". */
  function pathLabel(path: string) {
    const [head, tail] = path.split(".");
    const labels: Record<string, string> = {
      from: t("from"),
      to: t("to"),
      city: t("city"),
      area: t("area"),
      address: t("address"),
      floor: t("floor"),
      name: t("name"),
      phone: t("phone"),
      company: t("company"),
      visitDate: t("visitDate"),
      moveDate: t("moveDate"),
      rooms: t("rooms"),
      workstations: t("workstations"),
      details: t("details"),
    };
    return tail ? `${labels[head] ?? head} – ${labels[tail] ?? tail}` : (labels[head] ?? head);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    const int = (k: string) => (str(k) ? Number(str(k)) : undefined);
    const place = (side: "from" | "to") => ({
      city: str(`${side}.city`),
      area: str(`${side}.area`),
      address: str(`${side}.address`),
      floor: int(`${side}.floor`),
      elevator: f.get(`${side}.elevator`) === "on",
    });
    const body = {
      kind,
      name: str("name"),
      phone: str("phone"),
      company: kind === "office" ? str("company") : undefined,
      from: place("from"),
      to: place("to"),
      visitDate: str("visitDate"),
      moveDate: str("moveDate"),
      flexibleDate: f.get("flexibleDate") === "on",
      rooms: kind === "home" ? int("rooms") : undefined,
      workstations: kind === "office" ? int("workstations") : undefined,
      details: str("details"),
      services,
      acceptPrivacy: f.get("privacy") === "on",
      _hp: f.get("_hp"),
      _t: renderedAt,
    };

    setSending(true);
    setError(null);
    const url = `/api/v1/moves?lang=${locale}`;
    let result;
    if (photos.length) {
      // Multipart: nested fields as from[city], arrays as repeated keys.
      const data = new FormData();
      for (const [k, v] of Object.entries(body)) {
        if (v === undefined || v === null) continue;
        if (k === "from" || k === "to") {
          for (const [pk, pv] of Object.entries(v as Record<string, unknown>)) {
            if (pv !== undefined) data.append(`${k}[${pk}]`, String(pv));
          }
        } else if (Array.isArray(v)) v.forEach((x) => data.append(k, x));
        else data.append(k, String(v));
      }
      photos.forEach((p) => data.append("photos", p.file));
      result = await submitForm<{ number: string }>(url, data);
    } else {
      result = await submitJson<{ number: string }>(url, body);
    }
    setSending(false);
    if (result.ok) {
      setDone(result.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            setServices([]);
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

  const cities = UAE_EMIRATES[locale];
  const placeFields = (side: "from" | "to") => (
    <fieldset className="space-y-3 rounded-xl bg-background p-4">
      <legend className="px-1 font-bold">{t(side)}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("city")}</span>
          <select name={`${side}.city`} required defaultValue="" autoComplete="address-level1" className="field">
            <option value="" disabled />
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t("area")}</span>
          <input name={`${side}.area`} maxLength={60} autoComplete="address-level2" className="field" />
        </label>
      </div>
      <label className="block">
        <span className="label">{t("address")}</span>
        <input name={`${side}.address`} required minLength={3} maxLength={300} placeholder={t("addressHint")} className="field" />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block w-28">
          <span className="label">{t("floor")}</span>
          <input name={`${side}.floor`} type="number" inputMode="numeric" min={-5} max={200} dir="ltr" className="field text-start" />
        </label>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
          <input name={`${side}.elevator`} type="checkbox" className="size-4 accent-ink" />
          {t("elevator")}
        </label>
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={onSubmit} className="relative space-y-6 rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <h2 className="text-2xl font-extrabold">{t("formTitle")}</h2>
      <Honeypot />

      <fieldset>
        <legend className="label">{t("kind")}</legend>
        <div role="radiogroup" aria-label={t("kind")} className="grid gap-3 sm:grid-cols-2">
          {(["home", "office"] as const).map((k) => {
            const active = kind === k;
            const Icon = k === "home" ? Home : Building2;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setKind(k)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-start transition ${
                  active ? "border-ink bg-beige ring-1 ring-ink" : "border-border hover:border-ink/40"
                }`}
              >
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="block font-bold">{t(k)}</span>
                  <span className="block text-sm text-muted">{t(k === "home" ? "homeHint" : "officeHint")}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("name")}</span>
          <input name="name" required minLength={2} maxLength={60} autoComplete="name" className="field" />
        </label>
        <label className="block">
          <span className="label">{t("phone")}</span>
          <input name="phone" type="tel" required dir="ltr" autoComplete="tel" placeholder="050 123 4567" className="field text-start" />
        </label>
        {kind === "office" && (
          <label className="block sm:col-span-2">
            <span className="label">{t("company")}</span>
            <input name="company" maxLength={100} autoComplete="organization" className="field" />
          </label>
        )}
      </div>

      {placeFields("from")}
      {placeFields("to")}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("visitDate")}</span>
          <input
            name="visitDate"
            type="date"
            required
            min={today}
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            suppressHydrationWarning
            className="field"
          />
        </label>
        <label className="block">
          <span className="label">{t("moveDate")}</span>
          <input name="moveDate" type="date" min={visitDate || today} suppressHydrationWarning className="field" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input name="flexibleDate" type="checkbox" className="size-4 accent-ink" />
          {t("flexible")}
        </label>
        <label className="block">
          <span className="label">{t(kind === "home" ? "rooms" : "workstations")}</span>
          <input
            key={kind}
            name={kind === "home" ? "rooms" : "workstations"}
            type="number"
            inputMode="numeric"
            min={kind === "home" ? 0 : 1}
            max={kind === "home" ? 20 : 2000}
            dir="ltr"
            className="field text-start"
          />
        </label>
      </div>

      {moving.services.length > 0 && (
        <fieldset>
          <legend className="label">{t("services")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {moving.services.map((s) => {
              const on = services.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => setServices((prev) => (on ? prev.filter((k) => k !== s.key) : [...prev, s.key]))}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-start transition ${
                    on ? "border-ink bg-beige" : "border-border hover:border-ink/40"
                  }`}
                >
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${on ? "border-ink bg-ink text-white" : "border-ink/30"}`}>
                    {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block text-xs text-muted">{s.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <label className="block">
        <span className="label">{t("details")}</span>
        <textarea name="details" rows={3} maxLength={3000} placeholder={t("detailsHint")} className="field resize-y" />
      </label>

      <fieldset>
        <legend className="label">{t("photos")}</legend>
        <p className="mb-3 text-sm text-muted">{t("photosHint")}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.preview} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(p.preview);
                  setPhotos((prev) => prev.filter((_, j) => j !== i));
                }}
                aria-label={`${t("photos")} ${i + 1}`}
                className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              aria-label={t("photos")}
              className="grid aspect-square place-items-center rounded-lg border border-dashed border-ink/30 bg-beige/60 hover:bg-beige"
            >
              <Camera aria-hidden className="size-6" />
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </fieldset>

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
