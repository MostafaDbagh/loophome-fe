"use client";

import { ArrowUp, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import mark from "@/assets/svg/1-mark-ink.svg";
import { useStoreSettings } from "@/components/StoreSettings";
import type { Locale } from "@/i18n/routing";
import { shopEnabled } from "@/lib/api";
import { askAssistant, MAX_QUERY_LENGTH } from "@/lib/assistant/client";
import { conversationReducer, initialConversation } from "@/lib/assistant/conversation";
import { replyFor, STARTERS, STARTERS_SHOWN, type FlowContext, type FlowEvent, type Starter } from "@/lib/assistant/flows";
import type { Msg } from "@/lib/assistant/types";
import { AssistantReply } from "./AssistantReply";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const VISITS_KEY = "loophome:assistant-visits";
let visits: number | null = null;

/** Earlier visits from this browser (read and counted once per page load), so returning visitors see other starter pills. */
function readVisits(): number {
  if (visits === null) {
    try {
      visits = Math.max(0, Number(localStorage.getItem(VISITS_KEY)) || 0);
      localStorage.setItem(VISITS_KEY, String(visits + 1));
    } catch {
      visits = 0;
    }
  }
  return visits;
}
const noSubscription = () => () => {};

/**
 * The idle box's placeholder: the label, then example requests swiping up one after another.
 * Decorative only (the input's real placeholder stays the label); hidden by CSS as soon as the input is focused or filled.
 */
function SwipingPlaceholder({ label, examples }: { label: string; examples: string[] }) {
  // [shown, leaving]: -1 is the label.
  const [[shown, leaving], setSlide] = useState<[number, number | null]>([-1, null]);
  useEffect(() => {
    if (reducedMotion() || !examples.length) return;
    const timer = window.setInterval(() => setSlide(([now]) => [(now + 1) % examples.length, now]), 2800);
    return () => window.clearInterval(timer);
  }, [examples.length]);
  const line = (i: number) => (i < 0 ? label : examples[i]);
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 overflow-hidden text-base leading-6 text-muted peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden"
    >
      {leaving !== null && (
        <span key={`out${leaving}`} className="assist-swipe-out absolute inset-0 truncate">
          {line(leaving)}
        </span>
      )}
      <span key={shown} className={`absolute inset-0 truncate ${leaving !== null ? "assist-swipe-in" : ""}`}>
        {line(shown)}
      </span>
    </span>
  );
}

/**
 * The hero's "just tell LoopHome what you need" box: free text goes to the API's intent parser
 * (rule-based + AI); starter pills open a flow straight away. Answers lead to the store or to the
 * existing sell, moving and technician forms, already filled in.
 *
 */
export function HeroAssistant() {
  const t = useTranslations("assistant");
  const locale = useLocale() as Locale;
  const settings = useStoreSettings();
  const [state, dispatch] = useReducer(conversationReducer, initialConversation);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const request = useRef<AbortController | null>(null);
  const typing = useRef<number | null>(null);
  /** The last change came from a button inside the reply, which is now gone: move focus to the new message. */
  const answeredInside = useRef(false);

  const storeOn = shopEnabled(settings);
  const ctx: FlowContext = useMemo(
    () => ({
      storeOn,
      movingOn: !!settings?.moving?.enabled,
      technicianOn: !!settings?.technician?.enabled,
      technicianTypes: settings?.technician?.types.map((x) => x.key) ?? [],
      movingServices: settings?.moving?.services.map((x) => x.key) ?? [],
      whatsapp: settings?.store.whatsapp,
      query: state.query,
      t: (key, values) => t(key, values),
    }),
    [settings, storeOn, state.query, t],
  );
  const reply = state.status === "ready" && state.flow ? replyFor(state.flow, { slots: state.slots, answer: state.answer }, ctx) : null;

  // Starter pills: a few at a time, a different set on each visit; buying only while the store is open.
  // -1 until hydrated (the server can't know the visitor): the pills fade in once it's known.
  const visit = useSyncExternalStore(noSubscription, readVisits, () => -1);
  const starters = useMemo(() => {
    const pool = STARTERS.filter((s) => s.needs !== "store" || storeOn);
    const offset = Math.max(0, visit) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, STARTERS_SHOWN);
  }, [visit, storeOn]);

  // Example requests swipe through the placeholder while the box is idle.
  const examples = t.raw("ui.examples") as string[];
  const idle = !focused && !text && state.status === "idle";

  // A new reply that starts low on the screen: scroll the box (question and answer) to the top. Keyboard users keep their place.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (answeredInside.current) {
      answeredInside.current = false;
      messageRef.current?.focus({ preventScroll: true });
    }
    const top = replyRef.current?.getBoundingClientRect().top ?? 0;
    if (top > window.innerHeight * 0.6) rootRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
  }, [state.turn, state.status]);

  useEffect(
    () => () => {
      request.current?.abort();
      if (typing.current) window.clearInterval(typing.current);
    },
    [],
  );

  async function ask(query: string, starter?: string) {
    const q = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (!q) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    dispatch({ type: "ask", query: q, starter });
    const answer = await askAssistant(q, locale, controller.signal);
    if (!controller.signal.aborted) dispatch({ type: "answer", answer });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    stopTyping();
    // On phones, close the keyboard so the answer has the screen.
    if (window.matchMedia("(pointer: coarse)").matches) inputRef.current?.blur();
    void ask(text);
  }

  function stopTyping() {
    if (typing.current) window.clearInterval(typing.current);
    typing.current = null;
  }

  /** Types the starter's sentence into the box (quickly), then answers. */
  function onStarter(s: Starter) {
    const sentence = t(`starters.${s.id}.query`);
    const start = () => {
      if (s.ask) void ask(sentence, s.id);
      else if (s.flow) dispatch({ type: "start", query: sentence, starter: s.id, flow: s.flow, slots: s.slots });
    };
    request.current?.abort();
    stopTyping();
    if (reducedMotion()) {
      setText(sentence);
      start();
      return;
    }
    let shown = 0;
    const step = Math.max(1, Math.ceil(sentence.length / 22));
    typing.current = window.setInterval(() => {
      shown = Math.min(sentence.length, shown + step);
      setText(sentence.slice(0, shown));
      if (shown >= sentence.length) {
        stopTyping();
        start();
      }
    }, 16);
  }

  function onChoose(label: Msg | string, event: FlowEvent) {
    answeredInside.current = true;
    dispatch({ type: "choose", label, event });
  }

  function onReset() {
    request.current?.abort();
    stopTyping();
    setText("");
    dispatch({ type: "reset" });
    inputRef.current?.focus();
  }

  const thinking = state.status === "thinking";
  const announcement = thinking ? t("ui.thinking") : reply ? t(reply.message.key, reply.message.values) : "";

  return (
    <div ref={rootRef} className="w-full scroll-mt-20">
      <form
        onSubmit={onSubmit}
        role="search"
        aria-label={t("ui.label")}
        className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-surface p-1.5 ps-3 shadow-[0_1px_2px_rgb(20_20_20/0.04),0_14px_32px_-18px_rgb(20_20_20/0.35)] transition focus-within:border-ink/40 focus-within:ring-4 focus-within:ring-ink/10"
      >
        <Image src={mark} alt="" unoptimized className="size-6 shrink-0 sm:size-7" />
        <label htmlFor="hero-assistant" className="sr-only">
          {t("ui.label")}
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            id="hero-assistant"
            value={text}
            onChange={(e) => {
              stopTyping();
              setText(e.target.value);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("ui.label")}
            maxLength={MAX_QUERY_LENGTH}
            enterKeyHint="send"
            autoComplete="off"
            className={`assist-input peer w-full bg-transparent py-3 text-base text-ink ${
              idle ? "placeholder:text-transparent focus:placeholder:text-muted" : "placeholder:text-muted"
            }`}
          />
          {idle && <SwipingPlaceholder label={t("ui.label")} examples={examples} />}
        </div>
        {text && (
          <button
            type="button"
            onClick={() => {
              stopTyping();
              setText("");
              inputRef.current?.focus();
            }}
            aria-label={t("ui.clear")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-beige hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={!text.trim() || thinking}
          aria-label={t("ui.submit")}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-ink-soft active:scale-[0.96] disabled:opacity-35"
        >
          <ArrowUp aria-hidden className="size-5" />
        </button>
      </form>

      <ul
        aria-label={t("ui.suggestions")}
        className={`-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 transition-opacity duration-300 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden ${
          visit < 0 ? "opacity-0" : "opacity-100"
        }`}
      >
        {starters.map((s) => {
          const active = state.starter === s.id && state.status !== "idle";
          return (
            <li key={s.id} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onStarter(s)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                  active ? "border-ink bg-ink text-white" : "border-ink/15 bg-surface/80 text-ink hover:border-ink/40 hover:bg-surface"
                }`}
              >
                {t(`starters.${s.id}.label`)}
              </button>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div ref={replyRef}>
        {thinking && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-muted">
            <span aria-hidden className="flex gap-1">
              <span className="assist-dot size-1.5 rounded-full bg-ink" />
              <span className="assist-dot size-1.5 rounded-full bg-ink [animation-delay:150ms]" />
              <span className="assist-dot size-1.5 rounded-full bg-ink [animation-delay:300ms]" />
            </span>
            {t("ui.thinking")}
          </p>
        )}
        {reply && (
          <div className="mt-4">
            <AssistantReply
              key={state.turn}
              reply={reply}
              trail={state.trail}
              unsure={state.unsure}
              whatsapp={ctx.whatsapp}
              onChoose={onChoose}
              onToggle={(event) => dispatch({ type: "toggle", event })}
              onReset={onReset}
              messageRef={messageRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}
