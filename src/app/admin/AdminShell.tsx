"use client";

import { ClipboardList, Globe, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { adminSession, type AdminUser } from "@/lib/adminSession";
import { ADMIN_TEXT, type AdminLang, type AdminText } from "./i18n";

type Ctx = { admin: AdminUser; lang: AdminLang; t: AdminText };
const AdminContext = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

/** Signed-in frame for every /admin page: checks the token, top nav, language, sign out. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<{ admin: AdminUser; lang: AdminLang } | null>(null);

  useEffect(() => {
    const lang = adminSession.lang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (!adminSession.token()) {
      window.location.replace(`/${lang}`);
      return;
    }
    adminFetch<{ admin?: AdminUser } & AdminUser>("/admin/auth/me")
      .then((body) => setSession({ admin: body.admin ?? body, lang }))
      .catch(() => window.location.replace(`/${lang}`));
  }, []);

  if (!session) return <p className="p-8 text-center text-muted">…</p>;
  const { admin, lang } = session;
  const t = ADMIN_TEXT[lang];

  function switchLang() {
    const next: AdminLang = lang === "ar" ? "en" : "ar";
    adminSession.setLang(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    setSession({ admin, lang: next });
  }

  const nav = [
    { href: "/admin/orders", label: t.orders, icon: ClipboardList },
    { href: "/admin/settings", label: t.settings, icon: Settings },
  ];

  return (
    <AdminContext.Provider value={{ admin, lang, t }}>
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold ${
                    active ? "bg-ink text-white" : "hover:bg-beige"
                  }`}
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 text-sm">
            <span className="hidden text-muted sm:inline">
              {admin.name} · {admin.role === "owner" ? t.owner : t.staff}
            </span>
            <button type="button" onClick={switchLang} className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-semibold hover:bg-beige">
              <Globe aria-hidden className="size-4" />
              {lang === "ar" ? "English" : "العربية"}
            </button>
            <a href={`/${lang}`} className="hidden rounded-full px-3 py-2 font-semibold hover:bg-beige sm:inline-block">
              {t.site}
            </a>
            <button
              type="button"
              onClick={() => {
                adminSession.clear();
                window.location.replace(`/${lang}`);
              }}
              aria-label={t.logout}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-semibold hover:bg-beige"
            >
              <LogOut aria-hidden className="size-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </AdminContext.Provider>
  );
}
