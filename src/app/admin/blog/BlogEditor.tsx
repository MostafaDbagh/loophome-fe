"use client";

import { ArrowLeft, ExternalLink, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { useAdmin } from "../AdminShell";
import { fill } from "../i18n";

const CATEGORIES = ["selling", "buying", "moving", "home-services", "guides"] as const;
const LANGS = ["ar", "en"] as const;
type L = { en: string; ar: string };
type Post = {
  id: string;
  slug: string;
  category: string;
  tags: string[];
  author?: string;
  title: L;
  excerpt: L;
  content: L;
  cover?: { url: string } | null;
  status: "draft" | "published";
};
type Form = { slug: string; category: string; tags: string; author: string; title: L; excerpt: L; content: L };

const EMPTY: Form = { slug: "", category: "guides", tags: "", author: "", title: { en: "", ar: "" }, excerpt: { en: "", ar: "" }, content: { en: "", ar: "" } };
const LIMITS = { title: [5, 120], excerpt: [50, 300], content: [100, 60000] } as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

/** Create (no id) or edit a bilingual article; both languages are required by the API. */
export function BlogEditor({ id }: { id?: string }) {
  const { t, lang } = useAdmin();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    adminFetch<Post>(`/admin/blog/${id}`)
      .then((p) => {
        setPost(p);
        setForm({
          slug: p.slug,
          category: p.category,
          tags: p.tags.join(", "),
          author: p.author ?? "",
          title: p.title,
          excerpt: p.excerpt,
          content: p.content,
        });
      })
      .catch((e) => setMessage({ ok: false, text: adminErrorText(e, t.error) }));
  }, [id, t.error]);

  const setL = (field: "title" | "excerpt" | "content", l: "en" | "ar", v: string) =>
    setForm((f) => ({ ...f, [field]: { ...f[field], [l]: v } }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const body = new FormData();
    body.set("slug", form.slug.trim() || slugify(form.title.en));
    body.set("category", form.category);
    body.set("tags", JSON.stringify(form.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
    if (form.author.trim()) body.set("author", form.author.trim());
    for (const field of ["title", "excerpt", "content"] as const)
      for (const l of LANGS) body.set(`${field}[${l}]`, form[field][l].trim());
    if (cover) body.append("photos", cover.file);
    if (id && removeCover && !cover) body.set("removeCover", "true");
    if (!id) body.set("publish", String(publishNow));
    try {
      const saved = await adminFetch<Post>(id ? `/admin/blog/${id}` : "/admin/blog", { method: id ? "PATCH" : "POST", body });
      if (!id) {
        router.replace(`/admin/blog/${saved.id}`);
        return;
      }
      setPost(saved);
      setCover(null);
      setRemoveCover(false);
      setMessage({ ok: true, text: t.saved });
    } catch (err) {
      setMessage({ ok: false, text: adminErrorText(err, t.error) });
    } finally {
      setBusy(false);
    }
  }

  async function toggle() {
    if (!post) return;
    setBusy(true);
    try {
      const next = await adminFetch<Post>(`/admin/blog/${post.id}/${post.status === "published" ? "unpublish" : "publish"}`, { method: "POST" });
      setPost((p) => (p ? { ...p, status: next.status ?? (p.status === "published" ? "draft" : "published") } : p));
    } catch (err) {
      setMessage({ ok: false, text: adminErrorText(err, t.error) });
    } finally {
      setBusy(false);
    }
  }

  if (id && !post && !message) return <p className="p-6 text-center text-muted">{t.loading}</p>;

  const coverPreview = cover ? cover.url : removeCover ? null : post?.cover?.url;

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/admin/blog" aria-label={t.back} className="grid size-9 place-items-center rounded-full hover:bg-beige">
            <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
          <h1 className="text-2xl font-extrabold">{id ? t.edit : t.newPost}</h1>
          {post && (
            <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${post.status === "published" ? "bg-ink text-white" : "bg-beige"}`}>
              {t[post.status]}
            </span>
          )}
        </div>
        {post && (
          <div className="flex items-center gap-2">
            {post.status === "published" && (
              <a href={`/${lang}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3! py-1.5! text-sm">
                <ExternalLink aria-hidden className="size-4" />
                {t.view}
              </a>
            )}
            <button type="button" disabled={busy} onClick={toggle} className="btn-ghost px-3! py-1.5! text-sm">
              {post.status === "published" ? t.unpublish : t.publish}
            </button>
          </div>
        )}
      </div>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t.slug}</span>
          <input
            dir="ltr"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder={slugify(form.title.en) || "sell-used-furniture-dubai"}
            className="field"
          />
          <span className="mt-1 block text-xs text-muted">{t.slugHint}</span>
        </label>
        <label className="block">
          <span className="label">{t.category}</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.blogCategories[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t.tags}</span>
          <input dir="ltr" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="dubai, sofa, moving" className="field" />
        </label>
        <label className="block">
          <span className="label">{t.author}</span>
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="HomeLoop Team" className="field" />
        </label>

        <div className="sm:col-span-2">
          <span className="label">{t.cover}</span>
          <div className="flex flex-wrap items-center gap-3">
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview (blob or CDN)
              <img src={coverPreview} alt="" className="h-24 w-40 rounded-lg border border-border object-cover" />
            )}
            <label className="btn-ghost cursor-pointer px-3! py-1.5! text-sm">
              <ImagePlus aria-hidden className="size-4" />
              {t.addPhotos}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (cover) URL.revokeObjectURL(cover.url);
                  setCover(file ? { file, url: URL.createObjectURL(file) } : null);
                }} />
            </label>
            {id && post?.cover && !cover && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
                {t.removeCover}
              </label>
            )}
          </div>
        </div>
      </section>

      {LANGS.map((l) => (
        <section key={l} dir={l === "ar" ? "rtl" : "ltr"} lang={l} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-bold">{l === "ar" ? "العربية" : "English"}</h2>
          {(["title", "excerpt", "content"] as const).map((field) => {
            const value = form[field][l];
            const [min, max] = LIMITS[field];
            const bad = value.trim().length > 0 && (value.trim().length < min || value.trim().length > max);
            const Tag = field === "title" ? "input" : "textarea";
            return (
              <label key={field} className="block">
                <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold">
                  <span>{field === "title" ? t.titleField : t[field]}</span>
                  <span className={`text-xs font-normal ${bad ? "text-red-700" : "text-muted"}`}>
                    {fill(t.chars, { n: value.trim().length })} <bdi dir="ltr">({min}–{max})</bdi>
                  </span>
                </span>
                <Tag
                  required
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setL(field, l, e.target.value)}
                  rows={field === "content" ? 18 : 3}
                  minLength={min}
                  maxLength={max}
                  className={`field ${field === "content" ? "font-mono text-sm leading-relaxed" : ""}`}
                />
              </label>
            );
          })}
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="submit" disabled={busy} className="btn-cta px-5! py-2!">
          {busy ? t.saving : id ? t.saveDraft : publishNow ? t.publish : t.saveDraft}
        </button>
        {!id && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            {t.publishNow}
          </label>
        )}
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
