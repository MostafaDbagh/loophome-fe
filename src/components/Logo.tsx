import Image from "next/image";
import { useLocale } from "next-intl";
import lockupAr from "@/assets/svg/4-lockup-ar-ink.svg";
import lockupEn from "@/assets/svg/3-lockup-en-ink.svg";
import mark from "@/assets/svg/1-mark-ink.svg";
import { Link } from "@/i18n/navigation";

/** Brand lockup (mark + wordmark) from the brand pack; the mark alone on narrow phones. */
export function Logo({ name }: { name: string }) {
  const lockup = useLocale() === "ar" ? lockupAr : lockupEn;
  return (
    <Link href="/" aria-label={name} className="flex shrink-0 items-center">
      <Image src={mark} alt="" unoptimized loading="eager" className="size-9 min-[400px]:hidden" />
      <Image src={lockup} alt="" unoptimized loading="eager" className="hidden h-10 w-auto min-[400px]:block" />
    </Link>
  );
}
