"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Copies the product reference (e.g. HL-000123) with brief "Copied" feedback. */
export function CopyRef({ value }: { value: string }) {
  const t = useTranslations("product");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers / insecure context: select-and-copy fallback.
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("copyRef")}
      title={t("copyRef")}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted transition hover:bg-beige hover:text-ink"
    >
      {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
      <span aria-live="polite" className={copied ? "text-xs font-semibold" : "sr-only"}>
        {copied ? t("copied") : ""}
      </span>
    </button>
  );
}
