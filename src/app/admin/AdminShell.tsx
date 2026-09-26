"use client";

import { ExternalLink, Globe, House, LogOut, Menu, Settings, Sofa, Truck, Wrench, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { adminSession, type AdminUser } from "@/lib/adminSession";
import { ADMIN_TEXT, type AdminLang, type AdminText } from "./i18n";

type Ctx = { admin: AdminUser; lang: AdminLang; t: AdminText };
const AdminContext = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

/** Signed-in frame for every /admin page: token check, sidebar navigation, language, sign out. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ admin: AdminUser; lang: AdminLang } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const sidebar = (
    <Suspense>
      <SidebarNav
        t={t}
        admin={admin}
        lang={lang}
        onSwitchLang={switchLang}
        onNavigate={() => setMenuOpen(false)}
      />
    </Suspense>
  );

  return (
    <AdminContext.Provider value={{ admin, lang, t }}>
      <div className="min-h-dvh md:flex">
        {/* Desktop: fixed sidebar on the start side (right in Arabic, left in English). */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-border bg-surface md:block">{sidebar}</aside>

        {/* Phone/tablet: top bar with a slide-out menu. */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
          <span className="font-extrabold">HomeLoop Admin</span>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Menu" aria-expanded={menuOpen} className="grid size-10 place-items-center rounded-full hover:bg-beige">
            <Menu aria-hidden className="size-5" />
          </button>
        </div>
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal>
            <button type="button" aria-label="Close" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/40" />
            <aside className="absolute inset-y-0 start-0 w-72 max-w-[85%] bg-surface shadow-2xl">
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close" className="absolute end-3 top-3 grid size-9 place-items-center rounded-full hover:bg-beige">
                <X aria-hidden className="size-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

function SidebarNav({
  t,
  admin,
  lang,
  onSwitchLang,
  onNavigate,
}: {
  t: AdminText;
  admin: AdminUser;
  lang: AdminLang;
  onSwitchLang: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onOrders = pathname.startsWith("/admin/orders");
  const tab = params.get("tab") ?? "furniture";

  const orderLinks = [
    { tab: "furniture", label: t.furniture, icon: Sofa },
    { tab: "movers", label: t.movers, icon: Truck },
    { tab: "technicians", label: t.technicians, icon: Wrench },
  ];

  const item = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
      active ? "bg-ink text-white" : "text-ink hover:bg-beige"
    }`;

  return (
    <div className="flex h-full flex-col p-4">
      <p className="flex items-center gap-2 px-2 pb-6 pt-1 font-extrabold">
        <span className="grid size-8 place-items-center rounded-md bg-ink text-white">
          <House aria-hidden className="size-4" />
        </span>
        HomeLoop Admin
      </p>

      <nav aria-label={t.orders} className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.orders}</p>
          <ul className="space-y-1">
            {orderLinks.map(({ tab: key, label, icon: Icon }) => (
              <li key={key}>
                <Link
                  href={`/admin/orders?tab=${key}`}
                  onClick={onNavigate}
                  aria-current={onOrders && tab === key ? "page" : undefined}
                  className={item(onOrders && tab === key)}
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-border pt-4">
          <Link
            href="/admin/settings"
            onClick={onNavigate}
            aria-current={pathname.startsWith("/admin/settings") ? "page" : undefined}
            className={item(pathname.startsWith("/admin/settings"))}
          >
            <Settings aria-hidden className="size-4" />
            {t.settings}
          </Link>
        </div>
      </nav>

      <div className="space-y-1 border-t border-border pt-4">
        <p className="px-3 pb-2 text-sm">
          <span className="block font-semibold">{admin.name}</span>
          <span className="text-muted">{admin.role === "owner" ? t.owner : t.staff}</span>
        </p>
        <button type="button" onClick={onSwitchLang} className={item(false)}>
          <Globe aria-hidden className="size-4" />
          {lang === "ar" ? "English" : "العربية"}
        </button>
        <a href={`/${lang}`} className={item(false)}>
          <ExternalLink aria-hidden className="size-4" />
          {t.site}
        </a>
        <button
          type="button"
          onClick={() => {
            adminSession.clear();
            window.location.replace(`/${lang}`);
          }}
          className={item(false)}
        >
          <LogOut aria-hidden className="size-4" />
          {t.logout}
        </button>
      </div>
    </div>
  );
}
