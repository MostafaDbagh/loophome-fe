import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category, PublicSettings } from "@/lib/api";
import { whatsappUrl } from "@/lib/format";
import { WhatsAppIcon } from "./icons";
import { SoonTag } from "./ComingSoon";
import { Logo } from "./Logo";

export function Footer({
  categories,
  store,
  storeEnabled = true,
  movingEnabled = false,
  technicianEnabled = false,
}: {
  categories: Category[];
  store?: PublicSettings["store"];
  storeEnabled?: boolean;
  movingEnabled?: boolean;
  technicianEnabled?: boolean;
}) {
  const t = useTranslations();

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo name={t("meta.siteName")} />
          <p className="max-w-xs text-sm text-muted">{t("footer.about")}</p>
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
                ["conditionGrades", "/condition-grades"],
                ["privacy", "/privacy"],
                ["terms", "/terms"],
              ] as const
            ).map(([key, href]) => (
              <li key={key}>
                <Link href={href} className="inline-block py-1 hover:underline">
                  {t(`nav.${key}`)}
                </Link>
                {((key === "moving" && !movingEnabled) || (key === "technician" && !technicianEnabled)) && (
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
                <a
                  href={whatsappUrl(store.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-whatsapp-dark"
                >
                  <WhatsAppIcon className="size-4" />
                  <span dir="ltr">{store.whatsapp}</span>
                </a>
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
                {store.hours}
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
      <p className="border-t border-border py-5 text-center text-xs text-muted">
        {t("footer.rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
