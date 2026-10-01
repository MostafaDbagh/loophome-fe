import { CarFront, HandCoins, Store, Truck, Van, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { whatsappUrl } from "@/lib/format";
import { WhatsAppIcon } from "./icons";
import { LocaleSwitch } from "./LocaleSwitch";
import { AdminAccess } from "./AdminAccess";
import { SoonTag } from "./ComingSoon";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Header({
  whatsapp,
  storeEnabled = true,
  movingEnabled = false,
  technicianEnabled = false,
  pickupRentalEnabled = false,
  carRecoveryEnabled = false,
}: {
  whatsapp?: string;
  storeEnabled?: boolean;
  movingEnabled?: boolean;
  technicianEnabled?: boolean;
  pickupRentalEnabled?: boolean;
  carRecoveryEnabled?: boolean;
}) {
  const t = useTranslations();
  // Services the owner switched off stay listed with a "Soon" tag (their pages say "coming soon").
  const links = [
    { href: "/store", label: t("nav.store"), Icon: Store, soon: !storeEnabled },
    { href: "/moving", label: t("nav.moving"), Icon: Truck, soon: !movingEnabled },
    { href: "/technician", label: t("nav.technician"), Icon: Wrench, soon: !technicianEnabled },
    { href: "/pickup-rental", label: t("nav.pickupRental"), Icon: Van, soon: !pickupRentalEnabled },
    { href: "/car-recovery", label: t("nav.carRecovery"), Icon: CarFront, soon: !carRecoveryEnabled },
  ];
  const whatsappLink = whatsapp && (
    <a
      href={whatsappUrl(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("nav.whatsapp")}
      className="grid size-10 place-items-center rounded-full text-whatsapp-dark transition hover:bg-beige"
    >
      <WhatsAppIcon />
    </a>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <AdminAccess>
          <Logo name={t("meta.siteName")} />
        </AdminAccess>

        {/* Wide screens: every section in the bar. */}
        <nav aria-label={t("nav.menu")} className="hidden items-center gap-1 xl:flex">
          {links.map(({ href, label, Icon, soon }) => (
            <Link key={href} href={href} className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-beige">
              <Icon aria-hidden className="size-4" />
              {label}
              {soon && <SoonTag className="absolute -top-1 end-0 px-1.5 text-[10px] leading-4" />}
            </Link>
          ))}
          <LocaleSwitch />
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {whatsappLink}
          <Link href="/sell" className="btn-cta px-3! py-2! text-sm sm:px-4!">
            <HandCoins className="size-4" />
            <span className="sr-only sm:not-sr-only">{t("nav.sell")}</span>
          </Link>
          {/* Phones and tablets: the sections move into the burger menu. */}
          <MobileMenu
            navLabel={t("nav.menu")}
            openLabel={t("nav.openMenu")}
            closeLabel={t("nav.closeMenu")}
            items={links.map(({ href, label, Icon, soon }) => ({
              href,
              label,
              icon: <Icon aria-hidden className="size-4" />,
              tag: soon ? <SoonTag className="ms-auto inline-block px-1.5 text-[10px] leading-4" /> : undefined,
            }))}
            footer={<LocaleSwitch full />}
          />
        </div>
      </div>
    </header>
  );
}
