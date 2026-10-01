"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import type { FlowEvent, Option, Place, Step } from "@/lib/assistant/flows";
import type { Msg } from "@/lib/assistant/types";
import { DUBAI_AREAS } from "@/lib/seo/config";
import { cityName, UAE_EMIRATES } from "@/lib/ui";

/** Today in the UAE as YYYY-MM-DD (dates before it can't be picked). */
const todayUAE = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

export type Choose = (label: Msg | string, event: FlowEvent) => void;

const OPTION =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-[0.98]";
const OPTION_OFF = "border-border bg-background text-ink hover:border-ink/40";
const OPTION_ON = "border-ink bg-ink text-white";

export function AssistantStep({ step, onChoose, onToggle }: { step: Step; onChoose: Choose; onToggle: (event: FlowEvent) => void }) {
  switch (step.kind) {
    case "choice":
      return <ChoiceStep options={step.options} onChoose={onChoose} />;
    case "multi":
      return <MultiStep step={step} onChoose={onChoose} onToggle={onToggle} />;
    case "place":
      return <PlaceStep slot={step.slot} initial={step.initial} onChoose={onChoose} />;
    case "date":
      return <DateStep onChoose={onChoose} />;
  }
}

function ChoiceStep({ options, onChoose }: { options: Option[]; onChoose: Choose }) {
  const t = useTranslations("assistant");
  return (
    <ul className="flex flex-wrap gap-2">
      {options.map((o) => (
        <li key={o.id}>
          <button type="button" onClick={() => onChoose(o.label, o.event)} className={`${OPTION} ${OPTION_OFF}`}>
            {t(o.label.key, o.label.values)}
          </button>
        </li>
      ))}
    </ul>
  );
}

function MultiStep({ step, onChoose, onToggle }: { step: Extract<Step, { kind: "multi" }>; onChoose: Choose; onToggle: (event: FlowEvent) => void }) {
  const t = useTranslations("assistant");
  const picked = step.options.filter((o) => step.selected.includes(o.id));
  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {step.options.map((o) => {
          const on = step.selected.includes(o.id);
          return (
            <li key={o.id}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(o.event)} className={`${OPTION} ${on ? OPTION_ON : OPTION_OFF}`}>
                {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                {t(o.label.key, o.label.values)}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!picked.length}
        onClick={() => onChoose(picked.map((o) => t(o.label.key, o.label.values)).join(", "), step.done)}
        className="btn-cta mt-3 px-5! py-2! text-sm"
      >
        {t("ui.continue")}
      </button>
    </div>
  );
}

function PlaceStep({ slot, initial, onChoose }: { slot: "here" | "from" | "to"; initial: Place | null; onChoose: Choose }) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const id = useId();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const city = String(f.get("city") ?? "Dubai");
    const area = String(f.get("area") ?? "").trim().slice(0, 60);
    onChoose([area, cityName(city, locale)].filter(Boolean).join(", "), { type: "set", slots: { [slot]: { city, area } } });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto]">
      <label className="block">
        <span className="sr-only">{t("ui.emirate")}</span>
        <select name="city" defaultValue={initial?.city || "Dubai"} autoComplete="address-level1" className="field py-2!">
          {UAE_EMIRATES.en.map((c) => (
            <option key={c} value={c}>
              {cityName(c, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="sr-only">{t("ui.area")}</span>
        <input
          name="area"
          list={`${id}-areas`}
          defaultValue={initial?.area}
          maxLength={60}
          autoComplete="address-level2"
          placeholder={t("ui.areaHint")}
          className="field py-2!"
        />
        <datalist id={`${id}-areas`}>
          {DUBAI_AREAS.map((a) => (
            <option key={a.en} value={locale === "ar" ? a.ar : a.en} />
          ))}
        </datalist>
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-cta px-5! py-2! text-sm">
          {t("ui.continue")}
        </button>
        <button
          type="button"
          onClick={() => onChoose({ key: "ui.skip" }, { type: "set", slots: { [slot]: null } })}
          className="rounded-full px-3 py-2 text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {t("ui.skip")}
        </button>
      </div>
    </form>
  );
}

function DateStep({ onChoose }: { onChoose: Choose }) {
  const t = useTranslations("assistant");
  const locale = useLocale();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const date = String(new FormData(e.currentTarget).get("date") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const label = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { day: "numeric", month: "long", timeZone: "Asia/Dubai" }).format(
      new Date(`${date}T12:00:00+04:00`),
    );
    onChoose(label, { type: "set", slots: { date } });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <label className="block">
        <span className="sr-only">{t("ui.moveDate")}</span>
        <input name="date" type="date" required min={todayUAE()} suppressHydrationWarning className="field w-auto! py-2!" />
      </label>
      <button type="submit" className="btn-cta px-5! py-2! text-sm">
        {t("ui.continue")}
      </button>
      <button
        type="button"
        onClick={() => onChoose({ key: "ui.notSure" }, { type: "set", slots: { date: null } })}
        className="rounded-full px-3 py-2 text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
      >
        {t("ui.notSure")}
      </button>
    </form>
  );
}
