"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} target="_blank" className="font-semibold underline underline-offset-2">
      {children}
    </Link>
  );
}

/** Consent sentence with inline links to the Privacy Policy and Terms (open in a new tab). */
export function ConsentText({ messageKey }: { messageKey: "buy.privacy" | "sell.privacy" }) {
  const t = useTranslations();
  return (
    <span>
      {t.rich(messageKey, {
        privacy: (chunks) => <InlineLink href="/privacy">{chunks}</InlineLink>,
        terms: (chunks) => <InlineLink href="/terms">{chunks}</InlineLink>,
      })}
    </span>
  );
}
