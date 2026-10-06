"use client";

import { ArrowRight, FlaskConical, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Ref } from "react";
import { CloudImage } from "@/components/CloudImage";
import { WhatsAppIcon } from "@/components/icons";
import { PriceOrFree } from "@/components/Money";
import { Link } from "@/i18n/navigation";
import type { Action, FlowEvent, Reply } from "@/lib/assistant/flows";
import type { Msg, StoreMatches } from "@/lib/assistant/types";
import { textLang, whatsappUrl } from "@/lib/format";
import { AssistantStep, type Choose } from "./AssistantSteps";

type Props = {
  reply: Reply;
  trail: (Msg | string)[];
  /** The assistant isn't sure of its answer: it says it's still learning. */
  unsure: boolean;
  whatsapp?: string;
  onChoose: Choose;
  onToggle: (event: FlowEvent) => void;
  onReset: () => void;
  /** The message gets focus when the visitor answered from inside the reply (their button is gone). */
  messageRef?: Ref<HTMLParagraphElement>;
};

/** One answer from the assistant: what it says, what it asks next and where it can take the visitor. */
export function AssistantReply({ reply, trail, unsure, whatsapp, onChoose, onToggle, onReset, messageRef }: Props) {
  const t = useTranslations("assistant");
  const label = (m: Msg | string) => (typeof m === "string" ? m : t(m.key, m.values));

  return (
    <div className="animate-assist-in rounded-2xl border border-ink/10 bg-surface p-4 shadow-[0_1px_2px_rgb(20_20_20/0.04)] sm:p-5">
      {trail.length > 0 && (
        <ul aria-label={t("ui.yourChoices")} className="mb-3 flex flex-wrap gap-1.5">
          {trail.map((m, i) => (
            <li key={i} className="rounded-full bg-beige px-2.5 py-0.5 text-xs font-medium text-ink/80">
              {label(m)}
            </li>
          ))}
        </ul>
      )}

      <p ref={messageRef} tabIndex={-1} className="text-[15px] font-semibold leading-relaxed text-ink outline-none sm:text-base">
        {label(reply.message)}
      </p>

      {unsure && (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-2xl bg-beige px-3 py-1.5 text-xs font-medium leading-5 text-ink/80">
          <FlaskConical aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-bold">{t("ui.betaTag")}</span> · {t("ui.beta")}
          </span>
        </p>
      )}

      {reply.products && reply.products.items.length > 0 && <StoreItems matches={reply.products} />}

      {reply.step && (
        <div className="mt-4">
          <AssistantStep step={reply.step} onChoose={onChoose} onToggle={onToggle} />
        </div>
      )}

      {reply.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {reply.actions.map((a, i) => (
            <ActionButton key={i} action={a} whatsapp={whatsapp} label={t(a.label.key, a.label.values)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <RotateCcw aria-hidden className="size-3.5" />
        {t("ui.startOver")}
      </button>
    </div>
  );
}

function ActionButton({ action, whatsapp, label }: { action: Action; whatsapp?: string; label: string }) {
  if (action.kind === "whatsapp") {
    if (!whatsapp) return null;
    return (
      <a href={whatsappUrl(whatsapp, action.text)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp py-2! text-sm">
        <WhatsAppIcon className="size-4 text-whatsapp-dark" />
        {label}
      </a>
    );
  }
  return (
    <Link href={action.href} className={`${action.primary ? "btn-cta" : "btn-ghost"} py-2! text-sm`}>
      {label}
      {action.primary && <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />}
    </Link>
  );
}

/** Up to four matching items from the store, under a search answer. */
function StoreItems({ matches }: { matches: StoreMatches }) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  return (
    <section aria-label={t("ui.products")} className="mt-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {matches.items.map((p) => {
          const photo = p.photos[0];
          return (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block">
                <span className="relative block aspect-square overflow-hidden rounded-lg bg-beige">
                  {photo && (
                    <CloudImage
                      src={photo.url}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 130px, 45vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </span>
                <span lang={textLang(p.title)} className="ugc mt-1.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">
                  {p.title}
                </span>
                <span className="mt-0.5 block text-sm font-bold">
                  <PriceOrFree amount={p.price} currency={p.currency} locale={locale} freeLabel={t("ui.free")} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
