/** Admin session kept in this browser (JWT from POST /admin/auth/login, valid 7 days). */
export type AdminUser = { id: string; name: string; email: string; role: "owner" | "staff" };

const TOKEN = "hl_admin_token";
const LANG = "hl_admin_lang";

export const adminSession = {
  token: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN)),
  lang: (): "ar" | "en" => (typeof window !== "undefined" && localStorage.getItem(LANG) === "en" ? "en" : "ar"),
  save(token: string, lang: string) {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(LANG, lang);
  },
  setLang(lang: "ar" | "en") {
    localStorage.setItem(LANG, lang);
  },
  clear() {
    localStorage.removeItem(TOKEN);
  },
};
