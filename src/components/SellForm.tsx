"use client";

import { Camera, CheckCircle2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/api";
import { submitForm, type SubmitError } from "@/lib/submit";
import { Link } from "@/i18n/navigation";
import type { ProductCondition } from "@/lib/api";
import { readSellPrefill, type SellPrefill } from "@/lib/prefill";
import { routes } from "@/lib/seo/config";
import { cityName, UAE_EMIRATES } from "@/lib/ui";
import { ConsentText } from "./ConsentText";
import { FormErrors, Honeypot } from "./FormBits";
import { CATEGORY_ICONS } from "./icons";
import { withUrlPrefill } from "./UrlPrefill";

const MAX_PHOTOS = 10;
const CONDITIONS: ProductCondition[] = ["new", "premium", "semi_new", "good", "fair"];
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";

type Picked = { file: File; preview: string };

type SellType = "sell" | "list";

type SellFormProps = {
  categories: Category[];
  /** Owner-listing terms from settings; the "List it" option is hidden without them. */
  listing?: { commissionPercent: number; days: number };
  /** The ways to sell the admin has on, in order; at least one. */
  options: readonly SellType[];
  /** "Soon" in the page's language, on a way to sell the admin switched off. */
  soonLabel: string;
};

/** The sell form, with fields the hero assistant already knows filled in from the URL. */
export const SellForm = withUrlPrefill<SellFormProps, SellPrefill>(SellFormBody, readSellPrefill);

function SellFormBody({ categories, listing, options, soonLabel, prefill }: SellFormProps & { prefill?: SellPrefill }) {
  const t = useTranslations("sell");
  const locale = useLocale() as "ar" | "en";
  const fileInput = useRef<HTMLInputElement>(null);
  const [renderedAt, setRenderedAt] = useState(() => Date.now());
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [category, setCategory] = useState(() => categories.find((c) => c.slug === prefill?.category)?.id ?? "");
  const [type, setType] = useState<SellType>(options[0] ?? "sell");
  const [condition, setCondition] = useState<ProductCondition | "">("");
  const [askingPrice, setAskingPrice] = useState("");
  const tc = useTranslations("conditions");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);

  // Free the object URLs when the form goes away.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = [...list]
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES)
      .slice(0, room)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...picked]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos((prev) => prev.filter((_, j) => j !== i));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photos.length) return setError({ message: t("needPhotos") });
    if (!category) return setError({ message: t("needCategory") });
    // Buyers see an owner listing's condition as-is; for a sale to LoopHome we grade it ourselves.
    if (type === "list" && !condition) return setError({ message: t("needCondition") });

    const form = new FormData(e.currentTarget);
    const data = new FormData();
    photos.forEach((p) => data.append("photos", p.file));
    for (const key of ["name", "phone", "city", "area", "title", "description", "_hp"]) {
      data.append(key, String(form.get(key) ?? ""));
    }
    data.append("category", category);
    if (condition) data.append("condition", condition);
    data.append("askingPrice", String(form.get("askingPrice") ?? ""));
    // Optional; left out entirely when blank.
    const usage = String(form.get("usageValue") ?? "").trim();
    if (usage) {
      data.append("usageValue", usage);
      data.append("usageUnit", String(form.get("usageUnit") ?? "months"));
    }
    data.append("currency", "AED");
    data.append("type", type);
    data.append("acceptPrivacy", String(form.get("privacy") === "on"));
    data.append("_t", String(renderedAt));

    setSending(true);
    setError(null);
    const result = await submitForm<{ number: string }>(`/api/v1/sell-requests?lang=${locale}`, data);
    setSending(false);
    if (result.ok) {
      setDone(result.data);
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
    } else setError(result.error);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-16 text-ink" />
        <h2 className="mt-4 text-2xl font-extrabold">{t(type === "list" ? "listedTitle" : "successTitle")}</h2>
        <p className="mt-2 text-muted">{t(type === "list" ? "listedText" : "successText", { number: done.number })}</p>
        <button
          type="button"
          onClick={() => {
            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setPhotos([]);
            setCategory("");
            setAskingPrice("");
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
      <Honeypot />

      {/* 0. Sell to LoopHome or list it. A way the admin switched off stays visible, greyed out: its name and "Soon" only, never its terms. */}
      {listing && (
        <fieldset>
          <legend className="label">{t("typeLabel")}</legend>
          <div role="radiogroup" aria-label={t("typeLabel")} className="grid gap-3 sm:grid-cols-2">
            {(["sell", "list"] as const).map((option) => {
              const off = !options.includes(option);
              const active = !off && type === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={off}
                  onClick={() => setType(option)}
                  className={`rounded-xl border p-4 text-start transition ${
                    off
                      ? "cursor-not-allowed border-dashed border-ink/30 bg-beige/40"
                      : active
                        ? "border-ink bg-beige ring-1 ring-ink"
                        : "border-border hover:border-ink/40"
                  }`}
                >
                  <span className={`flex items-center gap-2 font-bold ${off ? "text-ink/50" : ""}`}>
                    {t(option === "sell" ? "typeSell" : "typeList")}
                    {off && <span className="rounded-sm bg-sand px-1.5 text-[10px] font-bold uppercase leading-4 text-ink">{soonLabel}</span>}
                  </span>
                  {!off && (
                    <span className="mt-1 block text-sm text-muted">
                      {option === "sell"
                        ? t("typeSellHint")
                        : t("typeListHint", { days: listing.days, commission: listing.commissionPercent })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 1. Photos */}
      <fieldset>
        <legend className="label">{t("photos")}</legend>
        <p className="mb-3 text-sm text-muted">{t("photosHint")}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.preview} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`${t("remove")} ${i + 1}`}
                className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/30 bg-beige/60 text-sm font-semibold text-ink transition hover:bg-beige"
            >
              <Camera className="size-7" />
              {t("addPhotos")}
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
          aria-label={t("addPhotos")}
        />
      </fieldset>

      {/* 2. Category chips */}
      <fieldset>
        <legend className="label">{t("category")}</legend>
        <div role="radiogroup" aria-label={t("category")} className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS.package;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                role="radio"
                aria-checked={active}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:border-ink/40"
                }`}
              >
                <Icon className="size-4" />
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Title + description */}
      <label className="block">
        <span className="label">{t("itemTitle")}</span>
        <input name="title" required minLength={3} maxLength={100} defaultValue={prefill?.title} placeholder={t("itemTitleHint")} className="field" />
      </label>
      <label className="block">
        <span className="label">{t("description")}</span>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          defaultValue={prefill?.description}
          placeholder={t("descriptionHint")}
          className="field resize-y"
        />
      </label>

      {/* 3b. Condition: required for owner listings (shown to buyers), optional when selling to us */}
      <fieldset>
        <legend className="label">
          {t("condition")}{" "}
          {type === "sell" && <span className="font-normal text-muted">({t("optional")})</span>}
        </legend>
        <p className="mb-3 text-sm text-muted">
          {t(type === "list" ? "conditionHintList" : "conditionHintSell")}{" "}
          <Link href={routes.conditionGrades} target="_blank" className="underline underline-offset-2">
            {t("conditionGuide")}
          </Link>
        </p>
        <div role="radiogroup" aria-label={t("condition")} className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const active = condition === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                // Tapping the selected chip again clears it (only matters while it's optional).
                onClick={() => setCondition(active && type === "sell" ? "" : c)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:border-ink/40"
                }`}
              >
                {tc(c)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 4. Asking price */}
      <div>
        <label htmlFor="asking-price" className="label">{t(type === "list" ? "priceList" : "price")}</label>
        <div dir="ltr" className="relative">
          <input id="asking-price" name="askingPrice" type="number" inputMode="decimal" min={0} step="0.01" required dir="ltr" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} aria-describedby="asking-price-hint" className="field pe-24 text-start" />
          <span aria-live="polite" className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm font-bold text-free">
            {askingPrice.trim() !== "" && Number(askingPrice) === 0 ? t("freePriceLabel") : ""}
          </span>
        </div>
        <span id="asking-price-hint" className="mt-2 block text-xs leading-relaxed text-muted">{t("priceFreeHint")}</span>
      </div>

      <div>
        <span className="label">
          {t("usage")} <span className="font-normal text-muted">({t("optional")})</span>
        </span>
        <div className="flex gap-2">
          <input name="usageValue" type="number" inputMode="numeric" min={0} max={600} step={1} dir="ltr" aria-label={t("usage")} className="field w-28! shrink-0 text-start" />
          <select name="usageUnit" defaultValue="months" aria-label={t("usage")} className="field min-w-0 flex-1">
            <option value="months">{t("months")}</option>
            <option value="years">{t("years")}</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-muted">{t("usageHint")}</p>
      </div>

      {/* 5. Contact */}
      <section className="space-y-4">
        <p className="text-lg font-bold">{t("contact")}</p>
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
            <select name="city" defaultValue={prefill?.city ?? ""} autoComplete="address-level1" className="field">
              <option value="" />
              {UAE_EMIRATES.en.map((c) => (
                <option key={c} value={c}>
                  {cityName(c, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">{t("area")}</span>
            <input name="area" maxLength={60} defaultValue={prefill?.area} autoComplete="address-level2" className="field" />
          </label>
        </div>
      </section>

      {/* 6. Privacy */}
      <label className="flex items-start gap-2.5 text-sm">
        <input name="privacy" type="checkbox" required className="mt-0.5 size-4 accent-ink" />
        <ConsentText messageKey="sell.privacy" />
      </label>

      <FormErrors error={error} fallback={t("error")} />

      <button type="submit" disabled={sending} className="btn-cta w-full py-3.5! text-lg">
        {sending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
