"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "./icons";

/** Native share sheet where supported (phones); otherwise a small menu of share links. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const t = useTranslations("share");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return; // user closed the sheet
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("copy"), url);
    }
  }

  const text = encodeURIComponent(`${title}\n${url}`);
  const links = [
    { label: t("whatsapp"), href: `https://wa.me/?text=${text}`, icon: <WhatsAppIcon className="size-4 text-whatsapp-dark" /> },
    { label: t("facebook"), href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: t("x"), href: `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={share} aria-expanded={open} aria-haspopup="menu" className="btn-ghost py-3.5!">
        <Share2 aria-hidden className="size-4" />
        {t("button")}
      </button>
      {open && (
        <div role="menu" aria-label={t("title")} className="absolute end-0 top-full z-20 mt-2 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          {links.map((l) => (
            <a
              key={l.label}
              role="menuitem"
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-beige"
            >
              {l.icon ?? <Share2 aria-hidden className="size-4" />}
              {l.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={copy}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm font-semibold hover:bg-beige"
          >
            {copied ? <Check aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
            <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
