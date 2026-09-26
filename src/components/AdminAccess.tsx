"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminSession, type AdminUser } from "@/lib/adminSession";
import { submitJson } from "@/lib/submit";

const CLICKS = 5;
const WINDOW_MS = 3000;

/**
 * Hidden admin entrance: five clicks on the logo within 3 seconds open the admin sign-in.
 * (It only hides the form; the password, the API's login rate limit and the token protect access.)
 */
export function AdminAccess({ children }: { children: React.ReactNode }) {
  const clicks = useRef<number[]>([]);
  const [open, setOpen] = useState(false);

  function onClickCapture() {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < WINDOW_MS), now];
    if (clicks.current.length >= CLICKS) {
      clicks.current = [];
      setOpen(true);
    }
  }

  return (
    <>
      <div onClickCapture={onClickCapture} className="shrink-0">
        {children}
      </div>
      {open && <AdminLoginDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AdminLoginDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    const result = await submitJson<{ token: string; admin: AdminUser }>(`/api/v1/admin/auth/login?lang=${locale}`, {
      email: String(f.get("email") ?? "").trim(),
      password: String(f.get("password") ?? ""),
    });
    setSending(false);
    if (result.ok) {
      adminSession.save(result.data.token, locale);
      router.push("/admin/overview");
    } else {
      setError(result.error.code === "TOO_MANY_REQUESTS" && result.error.message ? result.error.message : t("error"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="admin-title">
      <button type="button" aria-label={t("close")} onClick={onClose} className="absolute inset-0 bg-black/50" />
      <form onSubmit={onSubmit} className="relative w-full max-w-sm space-y-4 rounded-2xl bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute end-3 top-3 grid size-8 place-items-center rounded-full hover:bg-beige"
        >
          <X aria-hidden className="size-4" />
        </button>
        <h2 id="admin-title" className="text-xl font-extrabold">
          {t("title")}
        </h2>
        <label className="block">
          <span className="label">{t("email")}</span>
          <input ref={emailRef} name="email" type="email" required autoComplete="username" dir="ltr" className="field text-start" />
        </label>
        <label className="block">
          <span className="label">{t("password")}</span>
          <input name="password" type="password" required autoComplete="current-password" dir="ltr" className="field text-start" />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={sending} className="btn-cta w-full">
          {sending ? t("signingIn") : t("submit")}
        </button>
      </form>
    </div>
  );
}
