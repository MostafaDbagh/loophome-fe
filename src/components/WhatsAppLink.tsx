"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";
import { whatsappUrl } from "@/lib/format";

const subscribe = () => () => {};

/**
 * WhatsApp chat link that site-audit bots don't check: the server HTML links to the contact page (which
 * shows the number), and the browser swaps in the wa.me link as soon as it runs. wa.me answers 429 to
 * crawlers that check it once per page, so a plain link was reported as ~100 "broken external links".
 */
export function WhatsAppLink({ phone, text, className, children }: { phone: string; text?: string; className?: string; children: React.ReactNode }) {
  const locale = useLocale();
  // false on the server and while hydrating (so the first render matches the HTML), true right after.
  const live = useSyncExternalStore(subscribe, () => true, () => false);
  return live ? (
    <a href={whatsappUrl(phone, text)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <a href={`/${locale}/contact`} className={className}>
      {children}
    </a>
  );
}
