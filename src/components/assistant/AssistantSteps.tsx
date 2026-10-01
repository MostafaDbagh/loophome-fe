"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { FlowEvent, Option, Place, Step } from "@/lib/assistant/flows";
import type { Msg } from "@/lib/assistant/types";
import { DUBAI_AREAS } from "@/lib/seo/config";
import { cityName } from "@/lib/ui";

/** The assistant serves Dubai only for now. */
const CITY = "Dubai";
/** The area picker's last option: the visitor types the area's name. */
const OTHER = "__other";

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
  const areas: string[] = DUBAI_AREAS.map((a) => (locale === "ar" ? a.ar : a.en));
  const start = initial?.area ?? "";
  // A Dubai area from the list, or "Other" with the name typed in.
  const [area, setArea] = useState(!start || areas.includes(start) ? start : OTHER);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const typed = String(new FormData(e.currentTarget).get("otherArea") ?? "");
    const name = (area === OTHER ? typed : area).trim().slice(0, 60);
    onChoose([name, cityName(CITY, locale)].filter(Boolean).join(", "), { type: "set", slots: { [slot]: { city: CITY, area: name } } });
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-2 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
      <label className="block">
        <span className="sr-only">{t("ui.emirate")}</span>
        {/* Dubai only for now: shown, but it can't be changed. */}
        <select disabled defaultValue={CITY} className="field py-2!">
          <option value={CITY}>{cityName(CITY, locale)}</option>
        </select>
      </label>
      <div className="space-y-2">
        <label className="block">
          <span className="sr-only">{t("ui.area")}</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className={`field py-2! ${area ? "" : "text-muted"}`}>
            <option value="" disabled>
              {t("ui.chooseArea")}
            </option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value={OTHER}>{t("ui.otherArea")}</option>
          </select>
        </label>
        {area === OTHER && (
          <label className="block">
            <span className="sr-only">{t("ui.areaName")}</span>
            <input
              name="otherArea"
              required
              autoFocus
              defaultValue={areas.includes(start) ? "" : start}
              maxLength={60}
              autoComplete="off"
              placeholder={t("ui.areaName")}
              className="field py-2!"
            />
          </label>
        )}
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
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
