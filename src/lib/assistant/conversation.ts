/**
 * Conversation state for the hero assistant: one reducer, no React. The flows (flows.ts) decide
 * what to say from this state; the UI only renders it and dispatches events.
 */
import { startFrom, type FlowEvent, type FlowId, type Slots } from "./flows";
import type { AssistantAnswer, Msg } from "./types";

/** Below this, the answer is a best guess: the "still learning" note shows. */
const SURE = 0.7;

export type Conversation = {
  status: "idle" | "thinking" | "ready";
  /** What the visitor typed, or the starter pill's sentence. */
  query: string;
  answer: AssistantAnswer | null;
  flow: FlowId | null;
  slots: Slots;
  /** The visitor's choices so far, shown as small chips above the current question (text they typed stays as is). */
  trail: (Msg | string)[];
  /** The starter pill that began this conversation, if any. */
  starter: string | null;
  /** The assistant isn't sure (or couldn't reach the API): it says it's still learning. */
  unsure: boolean;
  /** Changes with every new reply, so the UI can replay its entrance. */
  turn: number;
};

export type ConversationEvent =
  | { type: "ask"; query: string; starter?: string }
  | { type: "answer"; answer: AssistantAnswer | null }
  | { type: "start"; query: string; starter: string; flow: FlowId; slots?: Slots }
  | { type: "choose"; label: Msg | string; event: FlowEvent }
  /** A multi-select option: changes the selection without a new turn. */
  | { type: "toggle"; event: FlowEvent }
  | { type: "reset" };

export const initialConversation: Conversation = {
  status: "idle",
  query: "",
  answer: null,
  flow: null,
  slots: {},
  trail: [],
  starter: null,
  unsure: false,
  turn: 0,
};

const isUnsure = (answer: AssistantAnswer | null) =>
  !answer ||
  answer.ambiguous ||
  (answer.intent === "UNKNOWN" ? !answer.flags.greeting && !answer.flags.offensive : answer.confidence < SURE);

const apply = (slots: Slots, event: FlowEvent): Slots => ({ ...slots, ...(event.slots ?? {}) });

export function conversationReducer(state: Conversation, event: ConversationEvent): Conversation {
  switch (event.type) {
    case "ask":
      return { ...initialConversation, status: "thinking", query: event.query, starter: event.starter ?? null, turn: state.turn };
    case "answer": {
      const { flow, slots } = startFrom(event.answer);
      return { ...state, status: "ready", answer: event.answer, flow, slots, trail: [], unsure: isUnsure(event.answer), turn: state.turn + 1 };
    }
    case "start":
      return {
        ...initialConversation,
        status: "ready",
        query: event.query,
        starter: event.starter,
        flow: event.flow,
        slots: event.slots ?? {},
        turn: state.turn + 1,
      };
    case "choose": {
      if (!state.flow) return state;
      const flow = event.event.type === "go" ? event.event.flow : state.flow;
      // Picking a clear path from a "did you mean…" or "not sure" answer means the assistant is on track again.
      const unsure = state.unsure && flow === state.flow;
      return { ...state, flow, slots: apply(state.slots, event.event), trail: [...state.trail, event.label], unsure, turn: state.turn + 1 };
    }
    case "toggle":
      return state.flow ? { ...state, slots: apply(state.slots, event.event) } : state;
    case "reset":
      return { ...initialConversation, turn: state.turn + 1 };
  }
}

