"use client";

import { CircleCheck, Newspaper, Package, CircleX, Clock, ExternalLink, Globe, House, LayoutDashboard, LogOut, Menu, Settings, Sofa, Truck, Wrench, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { adminSession, type AdminUser } from "@/lib/adminSession";
import { ADMIN_TEXT, type AdminLang, type AdminText } from "./i18n";
import { ORDER_TABS, type OrderState, type OrderTab } from "./orderTabs";

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
          <span className="font-extrabold">LoopHome Admin</span>
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
  const state = params.get("state") ?? "pending";
  const [pending, setPending] = useState<Partial<Record<OrderTab, number>>>({});

  // Open-order counts next to each Pending link, refreshed on every navigation.
  useEffect(() => {
    let alive = true;
    (Object.keys(ORDER_TABS) as OrderTab[]).forEach((k) => {
      const qs = new URLSearchParams({ status: ORDER_TABS[k].states.pending.join(","), limit: "1" });
      adminFetch<{ total: number }>(`${ORDER_TABS[k].path}?${qs}`)
        .then((d) => alive && setPending((p) => ({ ...p, [k]: d.total })))
        .catch(() => {});
    });
    return () => {
      alive = false;
    };
  }, [pathname, params]);

  const types: { tab: OrderTab; label: string; icon: typeof Sofa }[] = [
    { tab: "furniture", label: t.furniture, icon: Sofa },
    { tab: "movers", label: t.movers, icon: Truck },
    { tab: "technicians", label: t.technicians, icon: Wrench },
  ];
  const sections: { state: OrderState; label: string; icon: typeof Sofa }[] = [
    { state: "pending", label: t.pending, icon: Clock },
    { state: "completed", label: t.completed, icon: CircleCheck },
    { state: "cancelled", label: t.cancelled, icon: CircleX },
  ];

  const item = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-ink text-white" : "text-ink hover:bg-beige"
    }`;

  return (
    <div className="flex h-full flex-col p-4">
      <p className="flex items-center gap-2 px-2 pb-5 pt-1 font-extrabold">
        <span className="grid size-8 place-items-center rounded-md bg-ink text-white">
          <House aria-hidden className="size-4" />
        </span>
        LoopHome Admin
      </p>

      <nav aria-label={t.orders} className="flex-1 space-y-5 overflow-y-auto">
        <Link href="/admin/overview" onClick={onNavigate} className={item(pathname.startsWith("/admin/overview"))}>
          <LayoutDashboard aria-hidden className="size-4" />
          {t.overview}
        </Link>

        {sections.map(({ state: s, label, icon: SectionIcon }) => (
          <div key={s}>
            <p className="flex items-center gap-1.5 px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <SectionIcon aria-hidden className="size-3.5" />
              {label}
            </p>
            <ul className="space-y-0.5">
              {types.map(({ tab: k, label: typeLabel, icon: Icon }) => {
                const active = onOrders && tab === k && state === s;
                const count = s === "pending" ? pending[k] : undefined;
                return (
                  <li key={k}>
                    <Link
                      href={`/admin/orders?tab=${k}&state=${s}`}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={item(active)}
                    >
                      <Icon aria-hidden className="size-4" />
                      <span className="flex-1">{typeLabel}</span>
                      {count ? (
                        <span
                          className={`min-w-6 rounded-full px-1.5 text-center text-xs font-bold ${active ? "bg-white text-ink" : "bg-ink text-white"}`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="space-y-0.5 border-t border-border pt-4">
          {(
            [
              ["/admin/products", t.products, Package],
              ["/admin/blog", t.blog, Newspaper],
              ["/admin/settings", t.settings, Settings],
            ] as const
          ).map(([href, label, Icon]) => (
            <Link key={href} href={href} onClick={onNavigate} aria-current={pathname.startsWith(href) ? "page" : undefined} className={item(pathname.startsWith(href))}>
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="space-y-0.5 border-t border-border pt-4">
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
