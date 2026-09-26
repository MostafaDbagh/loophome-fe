"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminApiError, adminFetch } from "@/lib/adminApi";
import { UAE_EMIRATES } from "@/lib/ui";
import { useAdmin } from "../AdminShell";
import { refreshSite, ServiceToggles } from "../ServiceToggles";

type Service = { key: string; name: { en: string; ar: string }; fee: number; categories: string[]; isActive: boolean; isNew?: boolean };
type Store = { phone: string; whatsapp: string; email: string; address: string; hours: string };
type Form = {
  store: Store;
  delivery: { enabled: boolean; pickupEnabled: boolean; defaultFee: number; freeOver: number | null; cityFees: { city: string; fee: number }[] };
  services: Service[];
  visitFee: number | null;
  startingFrom: { home: number | null; office: number | null };
};
type AdminSettings = {
  store: Store;
  delivery: Form["delivery"];
  services: Service[];
  technician?: { visitFee: number | null };
  moving?: { startingFrom: { home: number | null; office: number | null } };
};
type Category = { id: string; name: { en: string; ar: string } };

/** "" → null, otherwise a non-negative number (empty inputs mean "off / hidden"). */
const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v)));
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export default function AdminSettingsPage() {
  const { t, lang, admin } = useAdmin();
  const canEdit = admin.role === "owner";
  const [form, setForm] = useState<Form | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null);

  useEffect(() => {
    Promise.all([adminFetch<AdminSettings>("/admin/settings"), adminFetch<{ items: Category[] }>("/admin/categories")])
      .then(([s, c]) => {
        setCategories(c.items);
        setForm({
          store: {
            phone: s.store?.phone ?? "",
            whatsapp: s.store?.whatsapp ?? "",
            email: s.store?.email ?? "",
            address: s.store?.address ?? "",
            hours: s.store?.hours ?? "",
          },
          delivery: { ...s.delivery, freeOver: s.delivery.freeOver ?? null },
          services: s.services.map((x) => ({ ...x, categories: x.categories.map(String) })),
          visitFee: s.technician?.visitFee ?? null,
          startingFrom: { home: s.moving?.startingFrom?.home ?? null, office: s.moving?.startingFrom?.office ?? null },
        });
      })
      .catch(() => setMessage({ ok: false, text: t.error }));
  }, [t.error]);

  if (!form) return <p className="p-6 text-center text-muted">{message?.text ?? t.loading}</p>;

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const setStore = (patch: Partial<Store>) => set({ store: { ...form.store, ...patch } });
  const setDelivery = (patch: Partial<Form["delivery"]>) => set({ delivery: { ...form.delivery, ...patch } });
  const setService = (i: number, patch: Partial<Service>) =>
    set({ services: form.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          store: Object.fromEntries(Object.entries(form.store).map(([k, v]) => [k, v.trim()])),
          delivery: {
            enabled: form.delivery.enabled,
            pickupEnabled: form.delivery.pickupEnabled,
            defaultFee: form.delivery.defaultFee,
            freeOver: form.delivery.freeOver,
            cityFees: form.delivery.cityFees.filter((c) => c.city.trim()),
          },
          // The API replaces the whole list.
          services: form.services.map(({ key, name, fee, categories, isActive }) => ({
            key: key || slug(name.en),
            name,
            fee,
            categories,
            isActive,
          })),
          technician: { visitFee: form.visitFee },
          moving: { startingFrom: form.startingFrom },
        }),
      });
      setForm({ ...form, services: form.services.map((s) => ({ ...s, key: s.key || slug(s.name.en), isNew: false })) });
      // Fees and contact details show on the website right away, not after the cache expires.
      await refreshSite();
      setMessage({ ok: true, text: t.saved });
    } catch (err) {
      const body = err instanceof AdminApiError ? err.body : {};
      setMessage({
        ok: false,
        text: body.error?.message ?? t.error,
        details: body.error?.details?.map((d) => `${d.path}: ${d.message}`),
      });
    } finally {
      setSaving(false);
    }
  }

  const numberInput = (value: number | null, onChange: (v: number | null) => void, label: string, allowEmpty = true) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        dir="ltr"
        disabled={!canEdit}
        value={value ?? ""}
        onChange={(e) => onChange(allowEmpty ? num(e.target.value) : (num(e.target.value) ?? 0))}
        className="field text-start"
      />
    </label>
  );

  const toggle = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" disabled={!canEdit} checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-ink" />
      {label}
    </label>
  );

  return (
    <div className="space-y-8">
      {!canEdit && <p className="rounded-xl bg-beige p-4 font-semibold">{t.ownerOnly}</p>}

      <ServiceToggles />

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">{t.contactTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["phone", t.storePhone, "tel", "ltr"],
              ["whatsapp", t.storeWhatsapp, "tel", "ltr"],
              ["email", t.storeEmail, "email", "ltr"],
              ["hours", t.storeHours, "text", undefined],
            ] as const
          ).map(([key, label, type, dir]) => (
            <label key={key} className="block">
              <span className="label">{label}</span>
              <input
                type={type}
                dir={dir}
                disabled={!canEdit}
                value={form.store[key]}
                onChange={(e) => setStore({ [key]: e.target.value })}
                placeholder={type === "tel" ? t.phoneHint : undefined}
                className="field text-start"
              />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="label">{t.storeAddress}</span>
            <input disabled={!canEdit} value={form.store.address} onChange={(e) => setStore({ address: e.target.value })} className="field" />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">{t.deliveryTitle}</h2>
        <div className="flex flex-wrap gap-6">
          {toggle(form.delivery.enabled, (v) => setDelivery({ enabled: v }), t.deliveryEnabled)}
          {toggle(form.delivery.pickupEnabled, (v) => setDelivery({ pickupEnabled: v }), t.pickupEnabled)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberInput(form.delivery.defaultFee, (v) => setDelivery({ defaultFee: v ?? 0 }), t.defaultFee, false)}
          {numberInput(form.delivery.freeOver, (v) => setDelivery({ freeOver: v }), t.freeOver)}
        </div>
        <div>
          <p className="label">{t.cityFees}</p>
          <div className="space-y-2">
            {form.delivery.cityFees.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  disabled={!canEdit}
                  value={c.city}
                  onChange={(e) => setDelivery({ cityFees: form.delivery.cityFees.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)) })}
                  aria-label={t.city}
                  className="field min-w-0 flex-1"
                >
                  {[...new Set([c.city, ...UAE_EMIRATES.en])].filter(Boolean).map((city) => (
                    <option key={city} value={city}>
                      {lang === "ar" ? (UAE_EMIRATES.ar[UAE_EMIRATES.en.indexOf(city)] ?? city) : city}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="any"
                  dir="ltr"
                  disabled={!canEdit}
                  aria-label={t.fee}
                  value={c.fee}
                  onChange={(e) =>
                    setDelivery({ cityFees: form.delivery.cityFees.map((x, j) => (j === i ? { ...x, fee: num(e.target.value) ?? 0 } : x)) })
                  }
                  className="field w-28! shrink-0 text-start"
                />
                {canEdit && (
                  <button
                    type="button"
                    aria-label={t.remove}
                    onClick={() => setDelivery({ cityFees: form.delivery.cityFees.filter((_, j) => j !== i) })}
                    className="grid size-10 place-items-center rounded-full hover:bg-beige"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                const used = new Set(form.delivery.cityFees.map((c) => c.city));
                const city = UAE_EMIRATES.en.find((c) => !used.has(c)) ?? "";
                setDelivery({ cityFees: [...form.delivery.cityFees, { city, fee: form.delivery.defaultFee }] });
              }}
              className="btn-ghost mt-3 py-1.5! text-sm"
            >
              <Plus aria-hidden className="size-4" />
              {t.addCity}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-extrabold">{t.servicesTitle}</h2>
          <p className="text-sm text-muted">{t.free}</p>
        </div>
        {form.services.map((s, i) => (
          <div key={s.key || `new-${i}`} className="space-y-3 rounded-xl bg-background p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
              <label className="block">
                <span className="label">{t.nameEn}</span>
                <input disabled={!canEdit} dir="ltr" value={s.name.en} onChange={(e) => setService(i, { name: { ...s.name, en: e.target.value } })} className="field" />
              </label>
              <label className="block">
                <span className="label">{t.nameAr}</span>
                <input disabled={!canEdit} dir="rtl" value={s.name.ar} onChange={(e) => setService(i, { name: { ...s.name, ar: e.target.value } })} className="field" />
              </label>
              {numberInput(s.fee, (v) => setService(i, { fee: v ?? 0 }), t.fee, false)}
            </div>
            <div>
              <p className="label">{t.categories}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setService(i, { categories: [] })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.categories.length === 0 ? "border-ink bg-ink text-white" : "border-border"}`}
                >
                  {t.allCategories}
                </button>
                {categories.map((c) => {
                  const on = s.categories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setService(i, { categories: on ? s.categories.filter((x) => x !== c.id) : [...s.categories, c.id] })}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-ink bg-ink text-white" : "border-border"}`}
                    >
                      {on && <Check aria-hidden className="size-3" />}
                      {c.name[lang]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              {toggle(s.isActive, (v) => setService(i, { isActive: v }), t.active)}
              <span className="text-xs text-muted" dir="ltr">
                {t.serviceKey}: {s.key || slug(s.name.en) || "—"}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => set({ services: form.services.filter((_, j) => j !== i) })}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline"
                >
                  <Trash2 aria-hidden className="size-4" />
                  {t.remove}
                </button>
              )}
            </div>
          </div>
        ))}
        {canEdit && (
          <button
            type="button"
            onClick={() => set({ services: [...form.services, { key: "", name: { en: "", ar: "" }, fee: 0, categories: [], isActive: true, isNew: true }] })}
            className="btn-ghost py-1.5! text-sm"
          >
            <Plus aria-hidden className="size-4" />
            {t.addService}
          </button>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold">{t.technicianTitle}</h2>
          {numberInput(form.visitFee, (v) => set({ visitFee: v }), t.visitFee)}
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold">{t.movingTitle}</h2>
          {numberInput(form.startingFrom.home, (v) => set({ startingFrom: { ...form.startingFrom, home: v } }), t.startingHome)}
          {numberInput(form.startingFrom.office, (v) => set({ startingFrom: { ...form.startingFrom, office: v } }), t.startingOffice)}
        </div>
      </section>

      {canEdit && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 p-3 md:-mx-8">
          <div className="flex flex-wrap items-center gap-3 px-4 md:px-8">
            <button type="button" onClick={save} disabled={saving} className="btn-cta">
              {saving ? t.saving : t.save}
            </button>
            {message && (
              <div role={message.ok ? "status" : "alert"} className={`text-sm font-semibold ${message.ok ? "text-ink" : "text-red-700"}`}>
                {message.ok && <Check aria-hidden className="me-1 inline size-4" />}
                {message.text}
                {message.details?.length ? <span className="block font-normal">{message.details.join(" · ")}</span> : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
