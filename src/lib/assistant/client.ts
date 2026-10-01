import type { Locale } from "@/i18n/routing";
import type { AssistantAnswer } from "./types";

/** Longest the visitor waits (the API itself gives the AI 6 s, then answers with its rule-based parser). */
const TIMEOUT_MS = 12_000;

/** Same limit as the API. */
export const MAX_QUERY_LENGTH = 300;

/**
 * Asks the API what the visitor wants. null when it can't be reached or refuses (rate limit,
 * validation): the assistant then shows its fallback options instead of an error.
 */
export async function askAssistant(query: string, locale: Locale, signal?: AbortSignal): Promise<AssistantAnswer | null> {
  // A plain controller rather than AbortSignal.any/timeout, which older iPhones lack.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const stop = () => controller.abort();
  signal?.addEventListener("abort", stop);
  try {
    const res = await fetch(`/api/v1/assistant/parse?lang=${locale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.slice(0, MAX_QUERY_LENGTH) }),
      signal: controller.signal,
    });
    return res.ok ? ((await res.json()) as AssistantAnswer) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}
