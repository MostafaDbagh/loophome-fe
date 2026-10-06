import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AREA_COPY, AREA_SLUGS, AREAS } from "@/content/areas";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Category, PublicSettings } from "@/lib/api";
import { listOf, storeHours } from "@/lib/format";
import { routes } from "@/lib/seo/config";
import { WhatsAppIcon } from "./icons";
import { WhatsAppLink } from "./WhatsAppLink";
import { SoonTag } from "./ComingSoon";
import { Logo } from "./Logo";

export function Footer({
  categories,
  store,
  storeEnabled = true,
  movingEnabled = false,
  technicianEnabled = false,
  pickupRentalEnabled = false,
  carRecoveryEnabled = false,
  sellToUsEnabled = true,
}: {
  categories: Category[];
  store?: PublicSettings["store"];
  storeEnabled?: boolean;
  movingEnabled?: boolean;
  technicianEnabled?: boolean;
  pickupRentalEnabled?: boolean;
  carRecoveryEnabled?: boolean;
  sellToUsEnabled?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const areas = AREA_COPY[locale].index.h1;
  // On every page, so it only names what's on: the store and each service follow their switches.
  const services = [movingEnabled && t("footer.serviceMoving"), technicianEnabled && t("footer.serviceTechnician")].filter((s): s is string => !!s);
  const about = [
    t(sellToUsEnabled ? "footer.about" : "footer.aboutList"),
    // aboutStore ("It resells them…") continues the buying sentence, so it is shown only with it.
    storeEnabled && sellToUsEnabled && t("footer.aboutStore"),
    services.length > 0 && t("footer.aboutServices", { services: listOf(services, locale) }),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo name={t("meta.siteName")} />
          <p className="max-w-xs text-sm text-muted">{about}</p>
        </div>

        <div>
          <p className="mb-3 font-bold">
            {t("nav.store")}
            {!storeEnabled && <SoonTag className="ms-2 inline-block px-1.5 align-middle text-[10px] leading-4" />}
          </p>
          <ul className="space-y-1 text-sm text-muted">
            {/* Store closed by the admin: no category links, the store page says "coming soon". */}
            {storeEnabled &&
              categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/store/${c.slug}`}
                    className="inline-block py-1 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            <li>
              <Link
                href="/sell"
                className="inline-block py-1 font-semibold text-ink"
              >
                {t("nav.sell")}
              </Link>
            </li>
            {/* These two and the area links below stay while selling to LoopHome is paused (the owner's choice): they lead to "Soon" pages. */}
            <li>
              <Link
                href="/sell/moving-out"
                className="inline-block py-1 hover:underline"
              >
                {t("footer.sellMovingOut")}
              </Link>
            </li>
            <li>
              <Link
                href="/sell/appliances"
                className="inline-block py-1 hover:underline"
              >
                {t("footer.sellAppliances")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-bold">{t("footer.company")}</p>
          <ul className="space-y-1 text-sm text-muted">
            {(
              [
                ["about", "/about"],
                ["blog", "/blog"],
                ["contact", "/contact"],
                ["moving", "/moving"],
                ["technician", "/technician"],
                ["pickupRental", "/pickup-rental"],
                ["carRecovery", "/car-recovery"],
                ["conditionGrades", "/condition-grades"],
                ["privacy", "/privacy"],
                ["terms", "/terms"],
              ] as const
            ).map(([key, href]) => (
              <li key={key}>
                <Link href={href} className="inline-block py-1 hover:underline">
                  {t(`nav.${key}`)}
                </Link>
                {((key === "moving" && !movingEnabled) ||
                  (key === "technician" && !technicianEnabled) ||
                  (key === "pickupRental" && !pickupRentalEnabled) ||
                  (key === "carRecovery" && !carRecoveryEnabled)) && (
                  <SoonTag className="ms-2 inline-block px-1.5 align-middle text-[10px] leading-4" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {(store?.whatsapp || store?.phone || store?.email || store?.hours || store?.address) && (
        <div>
          <p className="mb-3 font-bold">{t("footer.contact")}</p>
          <ul className="space-y-1 text-sm text-muted">
            {store?.whatsapp && (
              <li>
                <WhatsAppLink phone={store.whatsapp} className="inline-flex items-center gap-2 hover:text-whatsapp-dark">
                  <WhatsAppIcon className="size-4" />
                  <span dir="ltr">{store.whatsapp}</span>
                </WhatsAppLink>
              </li>
            )}
            {store?.phone && store.phone !== store.whatsapp && (
              <li className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                <a
                  href={`tel:${store.phone}`}
                  dir="ltr"
                  className="hover:underline"
                >
                  {store.phone}
                </a>
              </li>
            )}
            {store?.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4" />
                <a href={`mailto:${store.email}`} className="hover:underline">
                  {store.email}
                </a>
              </li>
            )}
            {store?.hours && (
              <li className="flex items-center gap-2">
                <Clock className="size-4" />
                {storeHours(store.hours, locale)}
              </li>
            )}
            {store?.address && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4" />
                {store.address}
              </li>
            )}
          </ul>
        </div>
        )}
      </div>
      <nav aria-label={areas} className="mx-auto max-w-6xl border-t border-border px-4 py-6 text-sm text-muted">
        <Link href={routes.areas} className="font-bold text-ink hover:underline">
          {areas}
        </Link>
        <ul className="mt-2 flex flex-wrap gap-x-4">
          {AREA_SLUGS.map((slug) => (
            <li key={slug}>
              <Link href={routes.area(slug)} className="inline-block py-1 hover:underline">
                {AREAS[slug].name[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="border-t border-border py-5 text-center text-xs text-muted">
        {t("footer.rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
