"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type MenuItem = { href: string; label: string; icon: React.ReactNode; tag?: React.ReactNode };

/**
 * The header's menu below `xl`: a two-line burger (the second line half as long) that turns into an X
 * and drops the site's sections under the header. Any link inside closes it; so do Escape and the backdrop.
 */
export function MobileMenu({
  items,
  footer,
  navLabel,
  openLabel,
  closeLabel,
}: {
  items: MenuItem[];
  footer: React.ReactNode;
  navLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const motion = "duration-300 ease-out motion-reduce:transition-none";

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center rounded-full transition hover:bg-beige xl:hidden"
      >
        <span aria-hidden className="relative block h-2.5 w-[22px]">
          <span className={`absolute start-0 top-0 h-0.5 w-full rounded-full bg-current transition-all ${motion} ${open ? "translate-y-1 rotate-45" : ""}`} />
          <span
            className={`absolute bottom-0 end-0 h-0.5 rounded-full bg-current transition-all ${motion} ${open ? "w-full -translate-y-1 -rotate-45" : "w-1/2"}`}
          />
        </span>
      </button>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-x-0 bottom-0 top-16 bg-ink/20 transition-opacity xl:hidden ${motion} ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        id={id}
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className={`absolute inset-x-0 top-full border-b border-border bg-background shadow-[0_18px_30px_-20px_rgb(20_20_20/0.35)] transition-[opacity,translate,visibility] xl:hidden ${motion} ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav aria-label={navLabel} className="mx-auto max-w-6xl px-4 pb-4 pt-2">
          <ul className="grid gap-1 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition hover:bg-beige">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-beige">{item.icon}</span>
                  {item.label}
                  {item.tag}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">{footer}</div>
        </nav>
      </div>
    </>
  );
}
