/**
 * The hero assistant's answer from the API (POST /api/v1/assistant/parse). Mirrors
 * server/src/modules/assistant/assistant.types.ts; the parsing itself (rule-based + AI) runs there.
 */
import type { Product } from "@/lib/api";

export const INTENT_IDS = [
  "BUY",
  "SELL_ONE",
  "SELL_MULTIPLE",
  "MOVING_HOME",
  "OFFICE_MOVING",
  "TECHNICIAN",
  "HANDYMAN",
  "DISMANTLING",
  "INSTALLATION",
  "ASSEMBLY",
  "CLEARANCE",
] as const;

export type IntentId = (typeof INTENT_IDS)[number];
export type GoodsCategory = "furniture" | "appliances" | "office";
export type ServiceId = "marketplace" | "resale" | "moving" | "technician" | "handyman";
export type When = "today" | "tomorrow" | "this_week" | "next_week" | "this_month" | "next_month" | "asap";
export type ProblemId =
  | "no_power"
  | "not_draining"
  | "not_spinning"
  | "leaking"
  | "not_cooling"
  | "not_heating"
  | "noisy"
  | "smell"
  | "no_picture"
  | "error";

export type IntentScore = {
  intent: IntentId;
  confidence: number;
  /** Item keys from the part of the request this intent comes from ("sell my sofa and buy a fridge"). */
  items?: string[];
};

export type ItemRef = {
  key: string;
  /** In the page language. */
  label: string;
  kind: GoodsCategory | "fixture";
  categorySlug: string;
  /** English store-search word. */
  search: string;
};

export type PlaceRef = { key: string; label: string; emirate: string; isEmirate: boolean };

export type StoreMatches = {
  q: string | null;
  category: string | null;
  /** false: nothing matched; the items are others from the same category. */
  exact: boolean;
  items: Product[];
};

export type AssistantAnswer = {
  intent: IntentId | "UNKNOWN";
  confidence: number;
  intents: IntentScore[];
  candidates: IntentScore[];
  ambiguous: boolean;
  category: GoodsCategory | null;
  service: ServiceId | null;
  entities: {
    item: ItemRef | null;
    items: ItemRef[];
    search: string | null;
    quantity: "one" | "multiple" | null;
    location: PlaceRef | null;
    from: PlaceRef | null;
    to: PlaceRef | null;
    when: When | null;
    problem: ProblemId | null;
    urgent: boolean;
  };
  flags: { offensive: boolean; greeting: boolean };
  source: "rules" | "ai";
  products: StoreMatches | null;
};

/** Translation reference in the "assistant" namespace, resolved by the UI. */
export type Msg = { key: string; values?: Record<string, string | number> };
