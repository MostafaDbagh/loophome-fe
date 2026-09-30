import { HandCoins, Store, Truck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { whatsappUrl } from "@/lib/format";
import { WhatsAppIcon } from "./icons";
import { LocaleSwitch } from "./LocaleSwitch";
import { AdminAccess } from "./AdminAccess";
import { SoonTag } from "./ComingSoon";
import { Logo } from "./Logo";

/**
 * "Soon" on a switched-off service: tiny and centred above the icon while the label is hidden,
 * at the label's end once it shows. Two elements, so centring and end-alignment never conflict.
 */
function NavSoon({ labelFrom }: { labelFrom: "sm" | "lg" }) {
  return labelFrom === "sm" ? (
    <>
      <SoonTag className="absolute inset-x-0 -top-1.5 mx-auto w-fit px-0.5 text-[8px] leading-3 sm:hidden" />
      <SoonTag className="absolute -top-1 end-0 hidden px-1.5 text-[10px] leading-4 sm:block" />
    </>
  ) : (
    <>
      <SoonTag className="absolute inset-x-0 -top-1.5 mx-auto w-fit px-0.5 text-[8px] leading-3 lg:hidden" />
      <SoonTag className="absolute -top-1 end-0 hidden px-1.5 text-[10px] leading-4 lg:block" />
    </>
  );
}

export function Header({
  whatsapp,
  storeEnabled = true,
  movingEnabled = false,
  technicianEnabled = false,
}: {
  whatsapp?: string;
  storeEnabled?: boolean;
  movingEnabled?: boolean;
  technicianEnabled?: boolean;
}) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <AdminAccess>
          <Logo name={t("meta.siteName")} />
        </AdminAccess>

        <nav aria-label={t("nav.menu")} className="flex items-center gap-0.5 sm:gap-2">
          {/* Services the owner switched off stay in the menu with a "Soon" tag (their pages say "coming soon"). */}
          <Link
            href="/store"
            className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition hover:bg-beige sm:px-3"
          >
            <Store className="size-4" />
            <span className="sr-only sm:not-sr-only">{t("nav.store")}</span>
            {!storeEnabled && <NavSoon labelFrom="sm" />}
          </Link>
          <Link
            href="/moving"
            className="relative inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold transition hover:bg-beige sm:px-3"
          >
            <Truck aria-hidden className="size-4" />
            <span className="sr-only lg:not-sr-only">{t("nav.moving")}</span>
            {!movingEnabled && <NavSoon labelFrom="lg" />}
          </Link>
          <Link
            href="/technician"
            className="relative inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold transition hover:bg-beige sm:px-3"
          >
            <Wrench aria-hidden className="size-4" />
            <span className="sr-only lg:not-sr-only">{t("nav.technician")}</span>
            {!technicianEnabled && <NavSoon labelFrom="lg" />}
          </Link>
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
