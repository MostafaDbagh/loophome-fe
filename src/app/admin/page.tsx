"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { adminSession, type AdminUser } from "@/lib/adminSession";

const TEXT = {
  ar: {
    hello: "مرحباً",
    owner: "مالك",
    staff: "موظف",
    soon: "لوحة الإدارة قيد الإنشاء. يمكنك حالياً استخدام واجهة الـ API.",
    logout: "تسجيل الخروج",
    home: "العودة للموقع",
  },
  en: {
    hello: "Welcome",
    owner: "Owner",
    staff: "Staff",
    soon: "The admin panel is being built. For now you can use the API.",
    logout: "Sign out",
    home: "Back to the site",
  },
};

/** Signed-in landing for admins (the full panel comes next). Unauthenticated visitors go home. */
export default function AdminHome() {
  const [session, setSession] = useState<{ admin: AdminUser; lang: "ar" | "en" } | null>(null);

  useEffect(() => {
    const l = adminSession.lang();
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    const token = adminSession.token();
    if (!token) {
      window.location.replace(`/${l}`);
      return;
    }
    fetch(`/api/v1/admin/auth/me?lang=${l}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        setSession({ admin: body.admin ?? body, lang: l });
      })
      .catch(() => {
        adminSession.clear();
        window.location.replace(`/${l}`);
      });
  }, []);

  if (!session) {
    return <p className="p-8 text-center text-muted">…</p>;
  }

  const { admin, lang } = session;
  const t = TEXT[lang];
  function logout() {
    adminSession.clear();
    window.location.replace(`/${lang}`);
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-16">
      <h1 className="text-3xl font-extrabold">
        {t.hello}، {admin.name}
      </h1>
      <p className="text-muted">
        <span dir="ltr">{admin.email}</span> · {admin.role === "owner" ? t.owner : t.staff}
      </p>
      <p className="rounded-xl bg-beige p-4">{t.soon}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={logout} className="btn-cta">
          <LogOut aria-hidden className="size-4" />
          {t.logout}
        </button>
        <a href={`/${lang}`} className="btn-ghost">
          {t.home}
        </a>
      </div>
    </main>
  );
}
