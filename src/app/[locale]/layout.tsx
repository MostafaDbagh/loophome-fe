import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreSettingsProvider } from "@/components/StoreSettings";
import { getCategories, getSettings, shopEnabled } from "@/lib/api";
import { AI_FILES, COUNTRY, SITE_NAME, SITE_URL, THEME_COLOR } from "@/lib/seo/config";
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/seo/jsonld";
import "../globals.css";

// English is the default locale: Geist is preloaded. Cairo preloads only its Arabic subset (its Latin
// glyphs load on demand via unicode-range), so English pages don't pay for a whole second font.
// display "optional": if the font isn't ready right away the fallback stays for this view, so text never
// re-wraps mid-load and pushes the store grid down (CLS). Cached fonts are used on the next view.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "optional" });
// "optional": the preloaded font is used if ready in time, never swapped in later (no layout shift).
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic"], display: "optional" });

const CLIENT_NAMESPACES = ["nav", "common", "conditions", "product", "buy", "store", "sell", "share", "moving", "technician", "pickupRental", "carRecovery", "admin"];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: THEME_COLOR };

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("home.title"), template: `%s | ${t("siteName")}` },
    description: t("home.description"),
    applicationName: SITE_NAME,
    appleWebApp: { title: t("siteName") },
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    category: "shopping",
    // Search Console (HTML tag method) for www.loophome.ae; the env var overrides it.
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || "DnN2E_A0ve1_15xweVxbEuDEybQxGFYkBz3HD9jVeic" },
    other: {
      "geo.region": COUNTRY.code,
      "geo.placename": locale === "ar" ? COUNTRY.nameAr : COUNTRY.name,
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const [settings, categories, messages] = await Promise.all([getSettings(locale), getCategories(locale), getMessages()]);
  // Only the namespaces client components use; page copy stays on the server.
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]),
  );

  return (
    <html
      lang={locale === "ar" ? "ar-AE" : "en-AE"}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${cairo.variable} h-full antialiased`}
    >
      <head>
        <link rel="alternate" type="text/plain" href={`${SITE_URL}${AI_FILES.llms}`} title="LLM context" />
        <link rel="alternate" type="text/plain" href={`${SITE_URL}${AI_FILES.llmsFull}`} title="LLM full context" />
      </head>
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationSchema(locale, settings), websiteSchema()]} />
        <NextIntlClientProvider messages={clientMessages}>
          <StoreSettingsProvider settings={settings}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
            >
              {tCommon("skip")}
            </a>
            <Header
              whatsapp={settings?.store.whatsapp}
              storeEnabled={shopEnabled(settings)}
              movingEnabled={!!settings?.moving?.enabled}
              technicianEnabled={!!settings?.technician?.enabled}
              pickupRentalEnabled={!!settings?.pickupRental?.enabled}
              carRecoveryEnabled={!!settings?.carRecovery?.enabled}
            />
            <main id="main" tabIndex={-1} className="flex-1 scroll-mt-16 outline-none">
              {children}
            </main>
            <Footer
              categories={categories}
              store={settings?.store}
              storeEnabled={shopEnabled(settings)}
              movingEnabled={!!settings?.moving?.enabled}
              technicianEnabled={!!settings?.technician?.enabled}
              pickupRentalEnabled={!!settings?.pickupRental?.enabled}
              carRecoveryEnabled={!!settings?.carRecovery?.enabled}
            />
          </StoreSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
