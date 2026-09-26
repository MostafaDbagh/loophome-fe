/**
 * UAE Dirham symbol (CBUAE, 2025), the same artwork as the owner's Trade app
 * (trade-v2 CurrencyMark / Trade-App aed-currency.svg). Drawn as SVG because the Unicode
 * sign (U+20C3) still renders as a box on many devices. Sized to the digits' height and
 * standing on the baseline (Tailwind preflight would otherwise centre SVGs), painted with
 * currentColor so it takes the colour and size of the text around it.
 */
export function DirhamSymbol({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 131 114"
      role="img"
      aria-label={label}
      fill="none"
      className="inline-block h-[0.757em] w-[0.87em] shrink-0 align-baseline"
    >
      <path
        d="M130.254 54.8906L129.264 53.9766C127.664 52.4531 125.76 51.6914 123.703 51.6914H113.039C113.191 53.5195 113.268 55.3477 113.268 57.3281C113.268 59.3086 113.191 61.1367 113.039 63.041H120.275C125.76 63.041 130.254 68.2207 130.254 74.6953V77.5898L129.264 76.5996C127.664 75.1523 125.76 74.3906 123.703 74.3906H111.439C105.574 100.061 85.084 114 52.7871 114H11.3496C11.3496 114 16.9863 109.658 16.9863 95.1094V74.3906H10.0547C4.49414 74.3906 0 69.1348 0 62.7363V59.8418L1.06641 60.7559C2.58984 62.2031 4.49414 63.041 6.55078 63.041H16.9863V51.6914H10.0547C4.49414 51.6914 0 46.4355 0 40.0371V37.1426L1.06641 38.1328C2.58984 39.5801 4.49414 40.3418 6.55078 40.3418H16.9863V20.4609C16.9863 5.45508 11.3496 0.732422 11.3496 0.732422H52.7871C84.1699 0.732422 105.193 14.5195 111.363 40.3418H120.275C125.76 40.3418 130.254 45.5215 130.254 51.9961V54.8906ZM51.2637 6.36914H33.9727V40.3418H92.0918C88.1309 16.7285 74.6484 6.36914 51.2637 6.36914ZM93.4629 57.3281C93.4629 55.3477 93.3867 53.5195 93.3105 51.6914H33.9727V63.041H93.3105C93.3867 61.1367 93.4629 59.3086 93.4629 57.3281ZM33.9727 108.287H51.416C76.1719 107.678 88.3594 95.7949 92.0918 74.3906H33.9727V108.287Z"
        fill="currentColor"
      />
    </svg>
  );
}

const number = (amount: number, locale: string) =>
  new Intl.NumberFormat(`${locale === "ar" ? "ar-AE" : "en-AE"}-u-nu-latn`, { maximumFractionDigits: 0 }).format(amount);

/**
 * Price for display: Dirham symbol before the amount in both languages (kept LTR so the symbol
 * stays left of the digits on Arabic pages too). Non-AED currencies fall back to Intl text.
 */
export function Money({ amount, currency, locale }: { amount: number; currency: string; locale: string }) {
  if (currency !== "AED") {
    return (
      <span dir="ltr" className="whitespace-nowrap">
        {new Intl.NumberFormat(`${locale === "ar" ? "ar-AE" : "en-AE"}-u-nu-latn`, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)}
      </span>
    );
  }
  return (
    <span dir="ltr" className="inline-flex items-baseline gap-[0.2em] whitespace-nowrap">
      <DirhamSymbol label={locale === "ar" ? "درهم" : "AED"} />
      <span>{number(amount, locale)}</span>
    </span>
  );
}
