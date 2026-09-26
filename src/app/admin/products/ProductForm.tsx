"use client";

import { ArrowLeft, ExternalLink, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import type { AdminCategory } from "./page";

const CONDITIONS = ["new", "premium", "semi_new", "good", "fair"] as const;
const MAX_PHOTOS = 10;
const MAX_BYTES = 8 * 1024 * 1024;

type Photo = { publicId: string; url: string; thumbUrl: string };
type Product = {
  id: string;
  slug: string;
  ref: string;
  inventoryItem: string;
  category?: AdminCategory;
  title: string;
  description: string;
  photos: Photo[];
  condition: string;
  price: number;
  originalPrice?: number | null;
  negotiable: boolean;
  warrantyDays: number;
  highlights: string[];
  freeDelivery: boolean;
  status: string;
};
type Form = {
  category: string;
  title: string;
  description: string;
  condition: string;
  price: string;
  originalPrice: string;
  purchasePrice: string;
  negotiable: boolean;
  warrantyDays: string;
  highlights: string;
  freeDelivery: boolean;
};

const EMPTY: Form = {
  category: "",
  title: "",
  description: "",
  condition: "good",
  price: "",
  originalPrice: "",
  purchasePrice: "",
  negotiable: false,
  warrantyDays: "30",
  highlights: "",
  freeDelivery: false,
};

/**
 * Adds a stock item to the store (no id) or edits one. A new product is three API steps:
 * inventory item (cost) → marked ready → product with photos; then optionally published.
 */
export function ProductForm({ id }: { id?: string }) {
  const { t, lang } = useAdmin();
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [publishAfter, setPublishAfter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Survives a failed product step so a retry doesn't create a second stock item.
  const inventoryId = useRef<string | null>(null);

  useEffect(() => {
    adminFetch<{ items: AdminCategory[] }>("/admin/categories")
      .then((d) => {
        setCategories(d.items);
        setForm((f) => (f.category ? f : { ...f, category: d.items[0]?.id ?? "" }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    adminFetch<Product>(`/admin/products/${id}`)
      .then((p) => {
        setProduct(p);
        setForm({
          category: p.category?.id ?? "",
          title: p.title,
          description: p.description,
          condition: p.condition,
          price: String(p.price),
          originalPrice: p.originalPrice ? String(p.originalPrice) : "",
          purchasePrice: "",
          negotiable: p.negotiable,
          warrantyDays: String(p.warrantyDays),
          highlights: p.highlights.join("\n"),
          freeDelivery: p.freeDelivery,
        });
      })
      .catch((e) => setMessage({ ok: false, text: adminErrorText(e, t.error) }));
  }, [id, t.error]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const kept = (product?.photos ?? []).filter((p) => !removed.includes(p.publicId));
  const photoCount = kept.length + added.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = [...list]
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES)
      .slice(0, MAX_PHOTOS - photoCount)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setAdded((a) => [...a, ...picked]);
  }

  function productBody() {
    const body = new FormData();
    body.set("category", form.category);
    body.set("title", form.title.trim());
    body.set("description", form.description.trim());
    body.set("condition", form.condition);
    body.set("price", form.price);
    body.set("originalPrice", form.originalPrice);
    body.set("negotiable", String(form.negotiable));
    body.set("warrantyDays", form.warrantyDays || "0");
    body.set("highlights", JSON.stringify(form.highlights.split("\n").map((s) => s.trim()).filter(Boolean)));
    body.set("freeDelivery", String(form.freeDelivery));
    for (const p of added) body.append("photos", p.file);
    return body;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (photoCount === 0) {
      setMessage({ ok: false, text: t.needPhoto });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (id) {
        const body = productBody();
        if (removed.length) body.set("removePhotos", JSON.stringify(removed));
        const saved = await adminFetch<Product>(`/admin/products/${id}`, { method: "PATCH", body });
        added.forEach((p) => URL.revokeObjectURL(p.url));
        setProduct(saved);
        setAdded([]);
        setRemoved([]);
        setMessage({ ok: true, text: t.saved });
        return;
      }
      if (!inventoryId.current) {
        const item = await adminFetch<{ id: string }>("/admin/inventory", {
          method: "POST",
          body: JSON.stringify({
            category: form.category,
            title: form.title.trim(),
            purchasePrice: Number(form.purchasePrice || 0),
          }),
        });
        await adminFetch(`/admin/inventory/${item.id}/stage`, { method: "POST", body: JSON.stringify({ stage: "ready" }) });
        inventoryId.current = item.id;
      }
      const body = productBody();
      body.set("inventoryItem", inventoryId.current);
      const created = await adminFetch<Product>("/admin/products", { method: "POST", body });
      if (publishAfter) await adminFetch(`/admin/products/${created.id}/publish`, { method: "POST" });
      router.replace(`/admin/products/${created.id}`);
    } catch (err) {
      setMessage({ ok: false, text: adminErrorText(err, t.error) });
    } finally {
      setBusy(false);
    }
  }

  if (id && !product && !message) return <p className="p-6 text-center text-muted">{t.loading}</p>;
  const live = product && ["active", "reserved", "sold"].includes(product.status);

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/admin/products" aria-label={t.back} className="grid size-9 place-items-center rounded-full hover:bg-beige">
            <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
          <h1 className="text-2xl font-extrabold">{id ? t.edit : t.newProduct}</h1>
          {product && (
            <>
              <span dir="ltr" className="font-mono text-sm font-bold">
                {product.ref}
              </span>
              <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${product.status === "active" ? "bg-ink text-white" : "bg-beige"}`}>
                {t.productStatus[product.status] ?? product.status}
              </span>
            </>
          )}
        </div>
        {live && (
          <a href={`/${lang}/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3! py-1.5! text-sm">
            <ExternalLink aria-hidden className="size-4" />
            {t.view}
          </a>
        )}
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <fieldset>
          <legend className="label">{t.photos}</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {[
              ...kept.map((p) => ({ key: p.publicId, src: p.thumbUrl, remove: () => setRemoved((r) => [...r, p.publicId]) })),
              ...added.map((p) => ({
                key: p.url,
                src: p.url,
                remove: () => {
                  URL.revokeObjectURL(p.url);
                  setAdded((a) => a.filter((x) => x !== p));
                },
              })),
            ].map((p, i) => (
              <div key={p.key} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview (blob or CDN) */}
                <img src={p.src} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={p.remove}
                  aria-label={`${t.removePhoto} ${i + 1}`}
                  className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted hover:border-ink/40">
                <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                  <ImagePlus aria-hidden className="size-5" />
                  {t.addPhotos}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">{t.titleField}</span>
            <input required minLength={3} maxLength={100} value={form.title} onChange={(e) => set("title", e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="label">{t.category}</span>
            <select required value={form.category} onChange={(e) => set("category", e.target.value)} className="field">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">{t.condition}</span>
            <select value={form.condition} onChange={(e) => set("condition", e.target.value)} className="field">
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {t.conditions[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">{t.description}</span>
            <textarea required minLength={10} maxLength={5000} rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className="field" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">{t.highlights}</span>
            <textarea rows={3} value={form.highlights} onChange={(e) => set("highlights", e.target.value)} className="field" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3">
        <label className="block">
          <span className="label">{t.salePrice} (AED)</span>
          <input required type="number" min={1} step="1" dir="ltr" value={form.price} onChange={(e) => set("price", e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="label">{t.originalPrice}</span>
          <input type="number" min={1} step="1" dir="ltr" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} className="field" />
        </label>
        {!id && (
          <label className="block">
            <span className="label">{t.purchasePrice}</span>
            <input required type="number" min={0} step="1" dir="ltr" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} className="field" />
          </label>
        )}
        <label className="block">
          <span className="label">{t.warrantyDays}</span>
          <input type="number" min={0} max={3650} dir="ltr" value={form.warrantyDays} onChange={(e) => set("warrantyDays", e.target.value)} className="field" />
        </label>
        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.negotiable} onChange={(e) => set("negotiable", e.target.checked)} />
            {t.negotiable}
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.freeDelivery} onChange={(e) => set("freeDelivery", e.target.checked)} />
            {t.freeDelivery}
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="submit" disabled={busy} className="btn-cta px-5! py-2!">
          {busy ? (id ? t.saving : t.creating) : id ? t.saveDraft : t.newProduct}
        </button>
        {!id && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publishAfter} onChange={(e) => setPublishAfter(e.target.checked)} />
            {t.publishAfter}
          </label>
        )}
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
