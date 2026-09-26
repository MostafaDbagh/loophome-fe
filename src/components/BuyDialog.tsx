"use client";

import { Check, CheckCircle2, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import { deliveryFee, hasFreeDelivery, serviceFee, servicesFor } from "@/lib/fees";
import { Money } from "./Money";
import { UAE_EMIRATES } from "@/lib/ui";
import { submitJson, type SubmitError } from "@/lib/submit";
import { ConsentText } from "./ConsentText";
import { FormErrors, Honeypot } from "./FormBits";
import { useStoreSettings } from "./StoreSettings";

type Fulfilment = "delivery" | "pickup";

export function BuyDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations("buy");
  const tc = useTranslations("common");
  const locale = useLocale() as "ar" | "en";
  const settings = useStoreSettings();
  const delivery = settings?.delivery;
  const services = servicesFor(product, settings);
  const [renderedAt] = useState(() => Date.now());

  const canDeliver = delivery?.enabled ?? true;
  const canPickup = delivery?.pickupEnabled ?? false;
  const cities = delivery?.cityFees.length ? delivery.cityFees.map((c) => c.city) : UAE_EMIRATES[locale];

  const [fulfilment, setFulfilment] = useState<Fulfilment>(canDeliver ? "delivery" : "pickup");
  const [city, setCity] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);

  const fee = deliveryFee(product, settings, fulfilment, city);
  const servicesTotal = services.filter((s) => picked.includes(s.key)).reduce((sum, s) => sum + serviceFee(s, product), 0);
  const total = product.price + fee + servicesTotal;
  const money = (n: number) => (n === 0 ? t("freeLabel") : <Money amount={n} currency={product.currency} locale={locale} />);
  const toggle = (key: string) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    const result = await submitJson<{ number: string }>(`/api/v1/orders?lang=${locale}`, {
      productId: product.id,
      customer: {
        name: f.get("name"),
        phone: f.get("phone"),
        city: f.get("city"),
        area: f.get("area") || undefined,
        address: f.get("address") || undefined,
        notes: f.get("notes") || undefined,
      },
      fulfilment,
      services: picked,
      acceptPrivacy: f.get("privacy") === "on",
      _hp: f.get("_hp"),
      _t: renderedAt,
    });
    setSending(false);
    if (result.ok) setDone(result.data);
    else setError(result.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal aria-labelledby="buy-title">
      <button type="button" aria-label={tc("close")} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          className="absolute end-4 top-4 grid size-9 place-items-center rounded-full hover:bg-gray-100"
        >
          <X className="size-5" />
        </button>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-ink" />
            <h2 className="mt-4 text-2xl font-extrabold">{t("successTitle")}</h2>
            <p className="mt-2 text-muted">{t("successText", { number: done.number })}</p>
            <button type="button" onClick={onClose} className="btn-cta mt-6">
              {tc("close")}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 id="buy-title" className="text-xl font-extrabold">
                {t("title")}
              </h2>
              <p className="text-sm text-muted">{t("subtitle")}</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-background p-3">
              {product.photos[0] && (
                <Image
                  src={product.photos[0].thumbUrl || product.photos[0].url}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="ugc truncate font-bold">{product.title}</p>
                <p className="font-extrabold text-ink">
                  <Money amount={product.price} currency={product.currency} locale={locale} />
                </p>
              </div>
            </div>

            <Honeypot />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("name")}</span>
                <input name="name" required minLength={2} maxLength={60} autoComplete="name" className="field" />
              </label>
              <label className="block">
                <span className="label">{t("phone")}</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  dir="ltr"
                  autoComplete="tel"
                  placeholder={t("phoneHint")}
                  className="field text-start"
                />
              </label>
            </div>

            {canDeliver && canPickup && (
              <div role="radiogroup" aria-label={t("delivery")} className="grid grid-cols-2 gap-2 rounded-full bg-background p-1">
                {(["delivery", "pickup"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={fulfilment === option}
                    onClick={() => setFulfilment(option)}
                    className={`rounded-full py-2 text-sm font-semibold transition ${
                      fulfilment === option ? "bg-surface text-ink shadow" : "text-muted"
                    }`}
                  >
                    {t(option)}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">{t("city")}</span>
                <select name="city" required autoComplete="address-level1" value={city} onChange={(e) => setCity(e.target.value)} className="field">
                  <option value="" disabled />
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">{t("area")}</span>
                <input name="area" maxLength={60} autoComplete="address-level2" className="field" />
              </label>
            </div>

            {fulfilment === "delivery" && (
              <label className="block">
                <span className="label">{t("address")}</span>
                <input
                  name="address"
                  required
                  maxLength={300}
                  autoComplete="street-address"
                  placeholder={t("addressHint")}
                  className="field"
                />
              </label>
            )}

            <label className="block">
              <span className="label">{t("notes")}</span>
              <textarea name="notes" rows={2} maxLength={500} className="field resize-none" />
            </label>

            {services.length > 0 && (
              <fieldset>
                <legend className="label">{t("services")}</legend>
                <p className="-mt-1 mb-2 text-xs text-muted">{t("servicesHint")}</p>
                <div className="space-y-2">
                  {services.map((s) => {
                    const on = picked.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(s.key)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-start text-sm transition ${
                          on ? "border-ink bg-beige" : "border-border hover:border-ink/40"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 font-semibold">
                          <span className={`grid size-5 place-items-center rounded border ${on ? "border-ink bg-ink text-white" : "border-ink/30"}`}>
                            {on && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          {s.name}
                        </span>
                        <span className={serviceFee(s, product) === 0 ? "font-semibold" : ""}>{money(serviceFee(s, product))}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <dl className="space-y-1.5 rounded-lg bg-background p-3.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t("item")}</dt>
                <dd>
                  <Money amount={product.price} currency={product.currency} locale={locale} />
                </dd>
              </div>
              {fulfilment === "delivery" && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t("deliveryFee")}</dt>
                  <dd>{hasFreeDelivery(product, settings) || city ? money(fee) : "—"}</dd>
                </div>
              )}
              {picked.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t("servicesFee")}</dt>
                  <dd>{money(servicesTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
                <dt>{t("total")}</dt>
                <dd>
                  <Money amount={total} currency={product.currency} locale={locale} />
                </dd>
              </div>
            </dl>

            <label className="flex items-start gap-2.5 text-sm">
              <input name="privacy" type="checkbox" required className="mt-0.5 size-4 accent-ink" />
              <ConsentText messageKey="buy.privacy" />
            </label>

            <FormErrors error={error} fallback={error?.code === "PRODUCT_UNAVAILABLE" ? t("unavailable") : t("error")} />

            <button type="submit" disabled={sending} className="btn-cta w-full py-3!">
              {sending ? t("sending") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
