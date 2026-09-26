import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="bg-ink bg-clip-text text-7xl font-extrabold text-transparent">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("text")}</p>
      <Link href="/" className="btn-cta mt-6">
        {t("home")}
      </Link>
    </div>
  );
}
