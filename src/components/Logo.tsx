import { Link } from "@/i18n/navigation";
import { INK, MARK_PATH, OFF_WHITE } from "./brand";

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
      {/* The app icon (full mark): at 36px it reads better than the 16px-tuned favicon. */}
      <svg viewBox="0 0 512 512" aria-hidden className="size-9 shrink-0">
        <rect width="512" height="512" rx="112" fill={INK} />
        <path fill={OFF_WHITE} fillRule="evenodd" transform="translate(86 82.6) scale(3.4)" d={MARK_PATH} />
      </svg>
      <span className="sr-only whitespace-nowrap text-lg min-[400px]:not-sr-only sm:text-xl">{name}</span>
    </Link>
  );
}
