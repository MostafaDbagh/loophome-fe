"use client";

import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { metaPrice, whatsappUrl } from "@/lib/format";
import dynamic from "next/dynamic";
import { WhatsAppIcon } from "./icons";
import { useStoreSettings } from "./StoreSettings";

// The order form is only needed after a tap, so its code isn't shipped with every product card.
const BuyDialog = dynamic(() => import("./BuyDialog").then((m) => m.BuyDialog), { ssr: false });

/** Buy (always) + Negotiate (only when negotiable). Buy spans the full width on its own. */
export function ProductActions({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  const t = useTranslations();
  const locale = useLocale();
  const settings = useStoreSettings();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pad = size === "lg" ? "py-3.5! text-base" : "py-2! text-sm";

  if (product.status !== "active") {
    return (
      <p className="rounded-full bg-gray-100 py-2 text-center text-sm font-semibold text-muted">
        {t(product.status === "sold" ? "common.sold" : "common.reserved")}
      </p>
    );
  }

  async function negotiate() {
    setBusy(true);
    setError("");
    // The tab must open synchronously, or popup blockers stop it.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const res = await fetch(`/api/v1/products/${product.id}/negotiate?lang=${locale}`, { method: "POST" });
      let url: string | undefined;
      if (res.ok) url = ((await res.json()) as { url: string }).url;
      else if (settings?.store.whatsapp) {
        const link = `${window.location.origin}/${locale}/products/${product.slug}`;
        url = whatsappUrl(
          settings.store.whatsapp,
          `${product.title} — ${metaPrice(product.price, product.currency, locale)}\n${link}`,
        );
      }
      if (!url) throw new Error("no whatsapp");
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch {
      tab?.close();
      setError(t("product.negotiateError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(true)} className={`btn-cta flex-1 ${pad}`}>
          <ShoppingBag className="size-4" />
          {t("product.buy")}
        </button>
        {product.negotiable && product.price > 0 && (
          <button type="button" onClick={negotiate} disabled={busy} className={`btn-whatsapp flex-1 ${pad}`}>
            <WhatsAppIcon className="size-4" />
            {t("product.negotiate")}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {open && <BuyDialog product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
