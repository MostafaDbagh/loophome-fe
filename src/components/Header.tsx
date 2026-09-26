import { HandCoins, Store, Truck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { whatsappUrl } from "@/lib/format";
import { WhatsAppIcon } from "./icons";
import { LocaleSwitch } from "./LocaleSwitch";
import { Logo } from "./Logo";

export function Header({
  whatsapp,
  movingEnabled = false,
  technicianEnabled = false,
}: {
  whatsapp?: string;
  movingEnabled?: boolean;
  technicianEnabled?: boolean;
}) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo name={t("meta.siteName")} />

        <nav aria-label={t("nav.menu")} className="flex items-center gap-0.5 sm:gap-2">
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition hover:bg-beige sm:px-3"
          >
            <Store className="size-4" />
            <span className="sr-only sm:not-sr-only">{t("nav.store")}</span>
          </Link>
          {movingEnabled && (
            <Link
              href="/moving"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-beige sm:inline-flex"
            >
              <Truck aria-hidden className="size-4" />
              {t("nav.moving")}
            </Link>
          )}
          {technicianEnabled && (
            <Link
              href="/technician"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-beige lg:inline-flex"
            >
              <Wrench aria-hidden className="size-4" />
              {t("nav.technician")}
            </Link>
          )}
          <LocaleSwitch />
          {whatsapp && (
            <a
              href={whatsappUrl(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("nav.whatsapp")}
              className="grid size-9 place-items-center rounded-full text-whatsapp-dark transition hover:bg-beige"
            >
              <WhatsAppIcon />
            </a>
          )}
          <Link href="/sell" className="btn-cta px-3! py-2! text-sm sm:px-4!">
            <HandCoins className="size-4" />
            <span className="sr-only sm:not-sr-only">{t("nav.sell")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
