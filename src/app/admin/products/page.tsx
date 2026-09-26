"use client";

import { Archive, ExternalLink, Eye, Pencil, Plus, Search, Send } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Money } from "@/components/Money";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill } from "../i18n";
import { Pagination } from "../Pagination";

export type AdminCategory = { id: string; slug: string; name: { en: string; ar: string } };
type Product = {
  id: string;
  ref: string;
  slug: string;
  title: string;
  photos: { thumbUrl: string }[];
  category?: AdminCategory;
  price: number;
  currency: string;
  status: string;
  inspected: boolean;
  stats?: { views: number };
};
type PageData = { items: Product[]; total: number; page: number; pages: number };

const STATUSES = ["", "active", "draft", "reserved", "sold", "archived"] as const;
const PUBLIC = new Set(["active", "reserved", "sold"]);

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductList />
    </Suspense>
  );
}

function ProductList() {
  const { t, lang } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";

  const [data, setData] = useState<PageData | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(q);
  const [reload, setReload] = useState(0);

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(`${pathname}?${next}`);
  }

  useEffect(() => {
    adminFetch<{ items: AdminCategory[] }>("/admin/categories")
      .then((d) => setCategories(d.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) qs.set("status", status);
    if (category) qs.set("category", category);
    if (q) qs.set("q", q);
    adminFetch<PageData>(`/admin/products?${qs}`)
      .then((d) => alive && (setData(d), setError("")))
      .catch((e) => alive && setError(adminErrorText(e, t.error)));
    return () => {
      alive = false;
    };
  }, [status, category, page, q, reload, t.error]);

  async function act(p: Product, action: "publish" | "archive") {
    try {
      await adminFetch(`/admin/products/${p.id}/${action}`, { method: "POST" });
      setReload((n) => n + 1);
    } catch (e) {
      setError(adminErrorText(e, t.error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.products}</h1>
        <Link href="/admin/products/new" className="btn-cta px-4! py-2! text-sm">
          <Plus aria-hidden className="size-4" />
          {t.newProduct}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap gap-1 rounded-2xl bg-beige p-1">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              role="tab"
              aria-selected={status === s}
              onClick={() => go({ status: s || null })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${status === s ? "bg-surface shadow" : "text-muted"}`}
            >
              {s ? t.productStatus[s] : t.all}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => go({ category: e.target.value || null })} aria-label={t.category} className="field w-auto! py-2!">
          <option value="">{t.all}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: search.trim() || null });
          }}
          className="relative w-full sm:w-72"
        >
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} aria-label={t.search} className="field py-2! ps-9!" />
        </form>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {!data ? (
        !error && <p className="p-6 text-center text-muted">{t.loading}</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">{t.empty}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{fill(t.count, { n: data.total })}</p>
          <ul className="space-y-2">
            {data.items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-3">
                {p.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                  <img src={p.photos[0].thumbUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="size-14 shrink-0 rounded-lg bg-beige" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono text-xs font-bold">
                      {p.ref}
                    </span>
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-ink text-white" : "bg-beige"}`}>
                      {t.productStatus[p.status] ?? p.status}
                    </span>
                    {!p.inspected && <span className="rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">{t.ownerListing}</span>}
                  </p>
                  <Link href={`/admin/products/${p.id}`} className="ugc mt-0.5 block truncate font-semibold hover:underline">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                    <span>{p.category?.name[lang]}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye aria-hidden className="size-3.5" />
                      {p.stats?.views ?? 0}
                    </span>
                  </p>
                </div>
                <span className="font-bold">
                  <Money amount={p.price} currency={p.currency} locale={lang} />
                </span>
                <div className="flex items-center gap-1">
                  {["draft", "archived", "expired"].includes(p.status) && (
                    <button type="button" onClick={() => act(p, "publish")} className="btn-cta px-3! py-1.5! text-sm">
                      <Send aria-hidden className="size-3.5" />
                      {t.publish}
                    </button>
                  )}
                  {p.status === "active" && (
                    <button type="button" onClick={() => act(p, "archive")} aria-label={t.archive} title={t.archive} className="grid size-9 place-items-center rounded-full hover:bg-beige">
                      <Archive aria-hidden className="size-4" />
                    </button>
                  )}
                  <Link href={`/admin/products/${p.id}`} aria-label={t.edit} title={t.edit} className="grid size-9 place-items-center rounded-full hover:bg-beige">
                    <Pencil aria-hidden className="size-4" />
                  </Link>
                  {PUBLIC.has(p.status) && (
                    <a
                      href={`/${lang}/products/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.view}
                      title={t.view}
                      className="grid size-9 place-items-center rounded-full hover:bg-beige"
                    >
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page ?? page} pages={Math.max(1, data.pages)} onPage={(n) => go({ page: String(n) })} t={t} />
        </>
      )}
    </div>
  );
}
