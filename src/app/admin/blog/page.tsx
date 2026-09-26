"use client";

import { ExternalLink, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill } from "../i18n";
import { Pagination } from "../Pagination";

type Post = {
  id: string;
  slug: string;
  category: string;
  title: { en: string; ar: string };
  status: "draft" | "published";
  publishedAt?: string | null;
  views: number;
  updatedAt: string;
};
type PageData = { items: Post[]; total: number; page: number; pages: number };
const STATUSES = ["", "published", "draft"] as const;

export default function AdminBlogPage() {
  return (
    <Suspense>
      <BlogList />
    </Suspense>
  );
}

function BlogList() {
  const { t, lang, admin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";

  const [data, setData] = useState<PageData | null>(null);
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
    let alive = true;
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) qs.set("status", status);
    if (q) qs.set("q", q);
    adminFetch<PageData>(`/admin/blog?${qs}`)
      .then((d) => alive && (setData(d), setError("")))
      .catch((e) => alive && setError(adminErrorText(e, t.error)));
    return () => {
      alive = false;
    };
  }, [status, page, q, reload, t.error]);

  async function act(post: Post, action: "publish" | "unpublish" | "delete") {
    if (action === "delete" && !window.confirm(`${t.confirmDelete}\n${post.title[lang]}`)) return;
    try {
      await adminFetch(action === "delete" ? `/admin/blog/${post.id}` : `/admin/blog/${post.id}/${action}`, {
        method: action === "delete" ? "DELETE" : "POST",
      });
      setReload((n) => n + 1);
    } catch (e) {
      setError(adminErrorText(e, t.error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.blog}</h1>
        <Link href="/admin/blog/new" className="btn-cta px-4! py-2! text-sm">
          <Plus aria-hidden className="size-4" />
          {t.newPost}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex gap-1 rounded-full bg-beige p-1">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              role="tab"
              aria-selected={status === s}
              onClick={() => go({ status: s || null })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${status === s ? "bg-surface shadow" : "text-muted"}`}
            >
              {s ? t[s] : t.all}
            </button>
          ))}
        </div>
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
            {data.items.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${post.status === "published" ? "bg-ink text-white" : "bg-beige"}`}>
                      {t[post.status]}
                    </span>
                    <span className="text-xs text-muted">{post.category}</span>
                  </p>
                  <Link href={`/admin/blog/${post.id}`} className="mt-1 block truncate font-semibold hover:underline">
                    {post.title[lang] || post.title.en}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" }) : "—"}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye aria-hidden className="size-3.5" />
                      {post.views}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {post.status === "published" ? (
                    <button type="button" onClick={() => act(post, "unpublish")} className="btn-ghost px-3! py-1.5! text-sm">
                      {t.unpublish}
                    </button>
                  ) : (
                    <button type="button" onClick={() => act(post, "publish")} className="btn-cta px-3! py-1.5! text-sm">
                      {t.publish}
                    </button>
                  )}
                  <Link href={`/admin/blog/${post.id}`} aria-label={t.edit} title={t.edit} className="grid size-9 place-items-center rounded-full hover:bg-beige">
                    <Pencil aria-hidden className="size-4" />
                  </Link>
                  {post.status === "published" && (
                    <a
                      href={`/${lang}/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.view}
                      title={t.view}
                      className="grid size-9 place-items-center rounded-full hover:bg-beige"
                    >
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  )}
                  {admin.role === "owner" && (
                    <button
                      type="button"
                      onClick={() => act(post, "delete")}
                      aria-label={t.delete}
                      title={t.delete}
                      className="grid size-9 place-items-center rounded-full text-red-700 hover:bg-red-50"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page ?? page} pages={Math.max(1, data.pages)} onPage={(p) => go({ page: String(p) })} t={t} />
        </>
      )}
    </div>
  );
}
