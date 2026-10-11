"use client";

import { ExternalLink, Eye, EyeOff, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PriceOrFree } from "@/components/Money";
import { adminErrorText, adminFetch, refreshPublicStore } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill } from "../i18n";
import { Pagination } from "../Pagination";
import { REQUESTS_CHANGED } from "../orderTabs";
import { normalizeOrderPage, normalizeOrderSearch } from "../orders/orderList";
import { LISTED_FILTERS, listedFilter, listedStatuses, productVisibilityAction } from "./productVisibility";

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
  expiresAt?: string | null;
};
type PageData = { items: Product[]; total: number; page: number; pages: number };

const STATUSES = ["", "active", "draft", "reserved", "archived", "expired"] as const;
const PUBLIC = new Set(["active", "reserved"]);

export default function ProductsPage({ view = "catalog" }: { view?: "catalog" | "listed" }) {
  return (
    <Suspense>
      <ProductList view={view} />
    </Suspense>
  );
}

export function ProductList({ view = "catalog" }: { view?: "catalog" | "listed" } = {}) {
  const { t, lang } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const listed = view === "listed";
  const copy = t.listedItemCopy;
  const visibility = listedFilter(params.get("visibility"));
  const status = listed ? listedStatuses(visibility).join(",") : STATUSES.find((s) => s === params.get("status")) ?? "";
  const category = /^[a-f\d]{24}$/i.test(params.get("category") ?? "") ? params.get("category")! : "";
  const page = normalizeOrderPage(params.get("page"));
  const q = normalizeOrderSearch(params.get("q"));
  const qs = new URLSearchParams({ page: String(page), limit: "20" });
  qs.set("status", status || STATUSES.filter(Boolean).join(","));
  if (category) qs.set("category", category);
  if (q) qs.set("q", q);
  const fetchPath = `/admin/products?${qs}`;

  const [result, setResult] = useState<{ key: string; data?: PageData; error?: string } | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(q);
  const [shownQ, setShownQ] = useState(q);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const acting = useRef(false);
  const [flash, setFlash] = useState("");
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestKey = `${lang}:${fetchPath}:${reload}`;
  const data = result?.key === requestKey ? result.data : undefined;
  const fetchError = result?.key === requestKey ? result.error : undefined;
  if (shownQ !== q) { setShownQ(q); setSearch(q); }

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    if (listed) { next.set("visibility", visibility); next.delete("status"); }
    if (q) next.set("q", q); else next.delete("q");
    if (category) next.set("category", category); else next.delete("category");
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(`${pathname}?${next}`);
  }

  useEffect(() => {
    let alive = true;
    adminFetch<{ items: AdminCategory[] }>("/admin/categories")
      .then((d) => { if (alive) setCategories(d.items); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    adminFetch<PageData>(fetchPath, { signal: controller.signal })
      .then((data) => { if (alive) setResult({ key: requestKey, data }); })
      .catch((e) => { if (alive) setResult({ key: requestKey, error: adminErrorText(e, t.error) }); });
    return () => { alive = false; controller.abort(); };
  }, [fetchPath, requestKey, t.error]);

  // Hiding the last visible item on a page must not leave the admin on an empty page.
  const lastPage = data ? Math.max(1, data.pages) : page;
  const recovering = page > lastPage;
  useEffect(() => {
    const invalidPage = params.has("page") && params.get("page") !== String(page);
    const invalidSearch = params.has("q") && params.get("q") !== q;
    if (!recovering && !invalidPage && !invalidSearch) return;
    const next = new URLSearchParams(params.toString());
    const targetPage = recovering ? lastPage : page;
    if (targetPage > 1) next.set("page", String(targetPage)); else next.delete("page");
    if (q) next.set("q", q); else next.delete("q");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [recovering, lastPage, page, q, params, pathname, router]);

  async function refreshStore() {
    setRefreshing(true);
    setRefreshFailed(!(await refreshPublicStore()));
    setRefreshing(false);
  }

  async function act(p: Product) {
    const action = productVisibilityAction(p.status);
    if (!action || acting.current) return;
    acting.current = true;
    setBusy(p.id); setError(""); setFlash("");
    try {
      await adminFetch(`/admin/products/${p.id}/${action}`, { method: "POST" });
      setFlash(fill(action === "archive" ? copy.hiddenSuccess : copy.visibleSuccess, { title: p.title }));
      window.dispatchEvent(new Event(REQUESTS_CHANGED));
      await refreshStore();
    } catch (e) {
      setError(adminErrorText(e, t.error));
    } finally {
      setReload((n) => n + 1);
      acting.current = false; setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{listed ? t.listedItems : t.products}</h1>
        <Link href="/admin/products/new" className="btn-cta px-4! py-2! text-sm">
          <Plus aria-hidden className="size-4" />
          {t.newProduct}
        </Link>
      </div>

      {listed && <div className="space-y-2">
        <p className="max-w-3xl text-sm leading-6 text-muted">{copy.intro}</p>
        <Link href="/admin/completed-orders?tab=furniture" className="inline-block text-sm font-semibold underline underline-offset-4">{copy.completedLink}</Link>
      </div>}
      <div className="flex flex-wrap items-center gap-2">
        {listed ? <nav aria-label={copy.filters} className="flex flex-wrap gap-1 rounded-2xl bg-beige p-1">
          {LISTED_FILTERS.map((filter) => <button key={filter} type="button" aria-current={visibility === filter ? "page" : undefined} onClick={() => go({ visibility: filter })} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${visibility === filter ? "bg-surface shadow" : "text-muted"}`}>{copy[filter]}</button>)}
        </nav> : <div role="tablist" className="flex flex-wrap gap-1 rounded-2xl bg-beige p-1">
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
        </div>}
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
            go({ q: normalizeOrderSearch(search) || null });
          }}
          className="relative w-full sm:w-72"
        >
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} placeholder={copy.search} aria-label={copy.search} className="field py-2! ps-9!" />
        </form>
      </div>

      {flash && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{flash}</p>}
      {refreshFailed && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><p>{copy.refreshWarning}</p><button type="button" disabled={refreshing} onClick={refreshStore} className="mt-2 font-semibold underline">{refreshing ? t.loading : copy.retryRefresh}</button></div>}
      {(error || fetchError) && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700"><p>{error || fetchError}</p>{fetchError && <button type="button" onClick={() => setReload((n) => n + 1)} className="mt-2 font-semibold underline">{t.retry}</button>}</div>}
      {!data || recovering ? (
        !fetchError && <p role="status" className="p-6 text-center text-muted">{t.loading}</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">{listed ? copy.empty : t.empty}</p>
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
                      {p.status === "active" ? copy.visible : p.status === "archived" ? copy.hidden : t.productStatus[p.status] ?? p.status}
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
                  <p className="mt-1 text-xs text-muted">{copy.stateHelp[p.status as keyof typeof copy.stateHelp] ?? ""}</p>
                </div>
                <span className="font-bold">
                  <PriceOrFree amount={p.price} currency={p.currency} locale={lang} freeLabel={t.freeWord} />
                </span>
                <div className="flex items-center gap-1">
                  {productVisibilityAction(p.status) && (
                    <button type="button" disabled={busy !== null} onClick={() => act(p)} aria-label={`${p.status === "active" ? copy.hide : p.status === "expired" ? copy.renew : copy.show}: ${p.title}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-beige disabled:opacity-50">
                      {p.status === "active" ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                      {busy === p.id ? t.saving : p.status === "active" ? copy.hide : p.status === "expired" ? copy.renew : copy.show}
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
