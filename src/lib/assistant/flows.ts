/**
 * Conversation flows for the hero assistant: what to say, what to ask next and where to hand off,
 * given the API's answer and the visitor's choices so far. Pure functions (no React); the copy is
 * in messages ("assistant"). Each flow asks only for what isn't known yet, then links to an
 * existing page or form with the answers filled in (see lib/prefill.ts).
 *
 * To add an intent: map it in FLOW_BY_INTENT (and directAction for mixed requests), add its
 * flow to FLOWS, and its copy to messages.
 */
import { prefillHref } from "@/lib/prefill";
import { routes } from "@/lib/seo/config";
import type { AssistantAnswer, IntentId, ItemRef, Msg, PlaceRef, ProblemId, StoreMatches } from "./types";

export type FlowId =
  | "buy"
  | "sell_one"
  | "sell_multi"
  | "moving"
  | "office"
  | "technician"
  | "handyman"
  | "dismantle"
  | "install"
  | "assembly"
  | "clearance"
  | "combo"
  | "clarify"
  | "unknown"
  | "error";

export type Place = { city: string; area: string };

/** A thing the visitor named or picked. */
export type Thing = { key: string; label: string; search?: string; categorySlug?: string };

/** What the assistant knows so far. `undefined` = not asked yet; `null` = asked and skipped. */
export type Slots = {
  /** Mixed requests: the intents to serve together, and the things each part of the request named. */
  intents?: IntentId[];
  intentItems?: Partial<Record<IntentId, Thing[]>>;
  item?: Thing;
  /** Several things named for one need ("sell my sofa and fridge"). */
  things?: Thing[];
  /** Selling several things: the groups picked, and whether the visitor confirmed them. */
  picks?: string[];
  picked?: boolean;
  /** Technician: what needs fixing, and what's wrong with it. */
  subject?: string;
  problem?: string;
  /** Handyman, installation or assembly: the job. */
  task?: string;
  /** Moving: move, sell or both; dismantling too; roughly how much. */
  scope?: "move" | "sell" | "both";
  dismantle?: boolean;
  size?: string;
  here?: Place | null;
  from?: Place | null;
  to?: Place | null;
  date?: string | null;
  /** Dismantling as part of a move. */
  forMove?: boolean;
  urgent?: boolean;
  /** An emirate named without an area: pre-selected when the assistant asks where. */
  hints?: Partial<Record<"here" | "from" | "to", Place>>;
};

export type FlowEvent = { type: "set"; slots: Partial<Slots> } | { type: "go"; flow: FlowId; slots?: Partial<Slots> };

export type Option = { id: string; label: Msg; event: FlowEvent };

export type Step =
  | { kind: "choice"; options: Option[] }
  /** Several options may be picked, then confirmed with `done`. */
  | { kind: "multi"; options: Option[]; selected: string[]; done: FlowEvent }
  | { kind: "place"; slot: "here" | "from" | "to"; initial: Place | null }
  | { kind: "date" };

export type Action =
  | { kind: "link"; label: Msg; href: string; primary?: boolean }
  | { kind: "whatsapp"; label: Msg; text: string; primary?: boolean };

export type Reply = {
  message: Msg;
  step?: Step;
  actions: Action[];
  products?: StoreMatches | null;
};

export type FlowContext = {
  storeOn: boolean;
  movingOn: boolean;
  technicianOn: boolean;
  /** Technician job types the admin offers, by key. */
  technicianTypes: string[];
  /** Moving extras the admin offers, by key. */
  movingServices: string[];
  whatsapp?: string;
  /** What the visitor typed (or the starter pill's sentence). */
  query: string;
  /** Translates a key in the "assistant" namespace: form prefill and WhatsApp text are in the page language. */
  t: (key: string, values?: Record<string, string | number>) => string;
};

type FlowState = { slots: Slots; answer: AssistantAnswer | null };
type Flow = (state: FlowState, ctx: FlowContext) => Reply;

const msg = (key: string, values?: Msg["values"]): Msg => ({ key, values });
/** A label inside a sentence: "Wardrobe" → "wardrobe", but "AC" and "TV unit" stay. */
export const inline = (label: string) => (/^\p{Lu}\p{Ll}/u.test(label) ? label[0]!.toLowerCase() + label.slice(1) : label);
const set = (slots: Partial<Slots>): FlowEvent => ({ type: "set", slots });
const go = (flow: FlowId, slots?: Partial<Slots>): FlowEvent => ({ type: "go", flow, slots });

// ---------- Jobs → technician types ----------

/**
 * Technician job types to use for a kind of job, best first: the first one the admin offers wins
 * (e.g. an "appliance_repair" type, once added in settings, takes appliance jobs from "handyman").
 */
const TYPE_PREFERENCES: Record<string, string[]> = {
  appliance: ["appliance_repair", "appliances", "handyman"],
  ac: ["ac", "appliance_repair"],
  plumbing: ["plumbing"],
  electrical: ["electrical"],
  curtains: ["curtains", "handyman"],
  assembly: ["furniture_assembly", "handyman"],
  tv: ["furniture_assembly", "handyman"],
  wall: ["handyman", "furniture_assembly"],
  repairs: ["handyman"],
};
const pickType = (job: string, ctx: FlowContext) => (TYPE_PREFERENCES[job] ?? ["handyman"]).find((k) => ctx.technicianTypes.includes(k));

/** What a technician can be asked to fix, and the usual problems of each. */
const SUBJECTS: { id: string; job: string; problems: string[] }[] = [
  { id: "washing_machine", job: "appliance", problems: ["not_draining", "not_spinning", "leaking", "no_power", "noisy"] },
  { id: "fridge", job: "appliance", problems: ["not_cooling", "leaking", "noisy", "no_power"] },
  { id: "dishwasher", job: "appliance", problems: ["not_draining", "leaking", "not_heating", "no_power"] },
  { id: "dryer", job: "appliance", problems: ["not_heating", "noisy", "no_power"] },
  { id: "oven", job: "appliance", problems: ["not_heating", "no_power", "error"] },
  { id: "ac", job: "ac", problems: ["not_cooling", "leaking", "noisy", "smell", "service"] },
  { id: "plumbing", job: "plumbing", problems: ["leaking", "blocked", "water_heater"] },
  { id: "electrical", job: "electrical", problems: ["no_power", "sockets", "lights"] },
  { id: "other_appliance", job: "appliance", problems: ["no_power", "no_picture", "leaking", "noisy", "error"] },
];
const SUBJECT_BY_ITEM: Record<string, string> = {
  washing_machine: "washing_machine",
  fridge: "fridge",
  dishwasher: "dishwasher",
  dryer: "dryer",
  oven: "oven",
  ac: "ac",
  water_heater: "plumbing",
  microwave: "other_appliance",
  water_dispenser: "other_appliance",
  tv: "other_appliance",
};

/** Handyman jobs: some open their own flow, the rest go straight to a request. */
const HANDYMAN_TASKS: { id: string; job?: string; flow?: FlowId }[] = [
  { id: "assembly", flow: "assembly" },
  { id: "dismantling", flow: "dismantle" },
  { id: "installation", flow: "install" },
  { id: "shelves", job: "wall" },
  { id: "tv", job: "tv" },
  { id: "curtains", job: "curtains" },
  { id: "repairs", job: "repairs" },
  { id: "other", job: "repairs" },
];
const INSTALL_THINGS: { id: string; job: string }[] = [
  { id: "tv", job: "tv" },
  { id: "shelves", job: "wall" },
  { id: "curtains", job: "curtains" },
  { id: "wall", job: "wall" },
  { id: "lights", job: "electrical" },
  { id: "ac", job: "ac" },
  { id: "washing_machine", job: "plumbing" },
  { id: "other", job: "repairs" },
];
const INSTALL_BY_ITEM: Record<string, string> = {
  tv: "tv",
  shelves: "shelves",
  curtains: "curtains",
  mirror: "wall",
  frames: "wall",
  ac: "ac",
  washing_machine: "washing_machine",
  dishwasher: "washing_machine",
};
const ASSEMBLY_THINGS = ["wardrobe", "bed", "desk", "shelving", "kids", "other"];
const ASSEMBLY_BY_ITEM: Record<string, string> = {
  wardrobe: "wardrobe",
  bed: "bed",
  bedroom_set: "bed",
  desk: "desk",
  shelves: "shelving",
  cabinet: "shelving",
  tv_unit: "shelving",
  crib: "kids",
};

// ---------- Selling ----------

/** What a single sale can be about, with its sell-form category. */
const SELL_ONE_THINGS: { id: string; categorySlug: string }[] = [
  { id: "sofa", categorySlug: "furniture-home" },
  { id: "bed", categorySlug: "furniture-home" },
  { id: "wardrobe", categorySlug: "furniture-home" },
  { id: "dining", categorySlug: "furniture-home" },
  { id: "fridge", categorySlug: "appliances-electronics" },
  { id: "washing_machine", categorySlug: "appliances-electronics" },
  { id: "office_chair", categorySlug: "office-equipment" },
];
/** Groups for selling several things at once. */
const SELL_GROUPS: { id: string; categorySlug: string }[] = [
  { id: "sofa", categorySlug: "furniture-home" },
  { id: "bedroom", categorySlug: "furniture-home" },
  { id: "dining", categorySlug: "furniture-home" },
  { id: "appliances", categorySlug: "appliances-electronics" },
  { id: "office", categorySlug: "office-equipment" },
  { id: "everything", categorySlug: "furniture-home" },
];
const GROUP_BY_ITEM: Record<string, string> = {
  sofa: "sofa",
  sofa_bed: "sofa",
  chair: "dining",
  bed: "bedroom",
  bedroom_set: "bedroom",
  wardrobe: "bedroom",
  mattress: "bedroom",
  cabinet: "bedroom",
  dining: "dining",
  table: "dining",
};
const groupFor = (item: ItemRef) =>
  GROUP_BY_ITEM[item.key] ?? (item.kind === "appliances" ? "appliances" : item.kind === "office" ? "office" : null);

// ---------- Hand-offs ----------

const placeFrom = (p: PlaceRef | null): Place | undefined =>
  p ? { city: p.emirate, area: p.isEmirate ? "" : p.label } : undefined;
/** A known community answers "where?"; an emirate alone still asks for the area. */
const knownPlace = (p: PlaceRef | null) => (p && !p.isEmirate ? placeFrom(p) : undefined);

const thing = (item: ItemRef): Thing => ({ key: item.key, label: item.label, search: item.search, categorySlug: item.categorySlug });

function sellHref(s: Slots, ctx: FlowContext) {
  const groups = (s.picks ?? []).map((id) => SELL_GROUPS.find((g) => g.id === id)).filter((g) => !!g);
  const groupLabels = groups.map((g) => ctx.t(`sellGroups.${g.id}`));
  if (s.things && s.things.length > 1) {
    return prefillHref(routes.sell, {
      title: ctx.t("prefill.severalItems"),
      description: ctx.t("prefill.sellItems", { items: s.things.map((x) => x.label).join(", ") }),
      category: s.things[0]!.categorySlug,
      city: (s.here ?? s.from)?.city,
      area: (s.here ?? s.from)?.area,
    });
  }
  const items = s.item ? [s.item.label] : groupLabels;
  const place = s.here ?? s.from;
  return prefillHref(routes.sell, {
    title: s.item?.label ?? (groups.length === 1 && groups[0]!.id !== "everything" ? groupLabels[0] : groups.length ? ctx.t("prefill.severalItems") : undefined),
    description: items.length > 1 || groups.length ? ctx.t("prefill.sellItems", { items: items.join(", ") }) : undefined,
    category: s.item?.categorySlug ?? groups[0]?.categorySlug,
    city: place?.city,
    area: place?.area,
  });
}

function movingHref(s: Slots, ctx: FlowContext, kind: "home" | "office") {
  const details = [
    s.size ? ctx.t("prefill.size", { size: ctx.t(`${kind === "office" ? "officeSizes" : "moveSizes"}.${s.size}`) }) : null,
    s.item ? ctx.t("prefill.itemsToMove", { items: s.item.label }) : null,
    ctx.t("prefill.fromAssistant", { query: ctx.query }),
  ].filter(Boolean);
  return prefillHref(routes.moving, {
    kind,
    fromCity: s.from?.city,
    fromArea: s.from?.area,
    toCity: s.to?.city,
    toArea: s.to?.area,
    moveDate: s.date ?? undefined,
    services: (s.dismantle || kind === "office") && ctx.movingServices.includes("dismantle_assemble") ? ["dismantle_assemble"] : undefined,
    details: details.join("\n"),
  });
}

function technicianHref(job: string, description: string, s: Slots, ctx: FlowContext) {
  return prefillHref(routes.technician, {
    type: pickType(job, ctx),
    description,
    city: s.here?.city,
    area: s.here?.area,
    urgent: s.urgent,
  });
}

const whatsapp = (ctx: FlowContext, primary = false): Action[] =>
  ctx.whatsapp ? [{ kind: "whatsapp", label: msg("actions.whatsapp"), text: ctx.t("whatsappText", { query: ctx.query }), primary }] : [];

/** Steps every service flow ends with: where the job is. */
const askHere = (s: Slots, message: Msg): Reply | null =>
  s.here === undefined ? { message, step: { kind: "place", slot: "here", initial: s.hints?.here ?? null }, actions: [] } : null;

/** A switched-off service: say so, and offer what is available. */
function comingSoon(key: string, ctx: FlowContext, sell = false): Reply {
  return {
    message: msg(key),
    actions: [...(sell ? [{ kind: "link", label: msg("actions.sellFurniture"), href: routes.sell, primary: true } as Action] : []), ...whatsapp(ctx, !sell)],
  };
}

// ---------- Flows ----------

const buy: Flow = ({ slots, answer }, ctx) => {
  if (!ctx.storeOn) return comingSoon("buy.storeOff", ctx, true);
  const products = answer?.products ?? null;
  const name = slots.item?.label ?? answer?.entities.search ?? null;
  const storeHref = products?.q ? `${routes.store}?q=${encodeURIComponent(products.q)}` : products?.category ? routes.category(products.category) : routes.store;
  const actions: Action[] = [{ kind: "link", label: msg(products?.q || products?.category ? "actions.seeAll" : "actions.browseStore"), href: storeHref, primary: true }];
  if (products?.q || products?.category) actions.push({ kind: "link", label: msg("actions.browseStore"), href: routes.store });

  let message: Msg;
  if (!products?.items.length) message = name ? msg("buy.none", { thing: name }) : msg("buy.browse");
  else if (!products.exact) message = msg("buy.similar", { thing: name ?? "", category: ctx.t(`categories.${products.category}`) });
  else message = name ? msg("buy.found", { thing: name }) : msg("buy.latest");
  return { message, products, actions: products?.items.length ? actions : [...actions, ...whatsapp(ctx)] };
};

const sellOne: Flow = ({ slots }, ctx) => {
  if (!slots.item) {
    return {
      message: msg("sellOne.ask"),
      step: {
        kind: "choice",
        options: [
          ...SELL_ONE_THINGS.map((o) => ({
            id: o.id,
            label: msg(`sellThings.${o.id}`),
            event: set({ item: { key: o.id, label: ctx.t(`sellThings.${o.id}`), categorySlug: o.categorySlug } }),
          })),
          { id: "several", label: msg("options.several"), event: go("sell_multi") },
        ],
      },
      actions: [{ kind: "link", label: msg("actions.sellItem"), href: routes.sell + "#request" }],
    };
  }
  const item = inline(slots.item.label);
  const actions: Action[] = [{ kind: "link", label: msg("actions.sellThis", { item }), href: sellHref(slots, ctx), primary: true }];
  if (slots.item.categorySlug === "appliances-electronics") {
    actions.push({ kind: "link", label: msg("actions.sellAppliancesGuide"), href: routes.sellAppliances });
  }
  return { message: msg("sellOne.ready", { item }), actions };
};

const sellMulti: Flow = ({ slots }, ctx) => {
  if (!slots.picked) {
    const selected = slots.picks ?? [];
    return {
      message: msg("sellMulti.ask"),
      step: {
        kind: "multi",
        selected,
        options: SELL_GROUPS.map((g) => ({
          id: g.id,
          label: msg(`sellGroups.${g.id}`),
          event: set({ picks: selected.includes(g.id) ? selected.filter((x) => x !== g.id) : [...selected, g.id] }),
        })),
        done: set({ picked: true }),
      },
      actions: [],
    };
  }
  return {
    message: msg("sellMulti.ready"),
    actions: [
      { kind: "link", label: msg("actions.listFurniture"), href: sellHref(slots, ctx), primary: true },
      ...whatsapp(ctx),
      { kind: "link", label: msg("actions.movingOutGuide"), href: routes.sellMovingOut },
    ],
  };
};

const MOVE_SIZES = ["few", "small", "medium", "large"];

const moving: Flow = ({ slots }, ctx) => {
  if (!ctx.movingOn) return comingSoon("moving.off", ctx, true);
  if (!slots.scope) {
    return {
      message: msg("moving.ask"),
      step: {
        kind: "choice",
        options: [
          { id: "move", label: msg("options.moveFurniture"), event: set({ scope: "move" }) },
          { id: "sell", label: msg("options.sellFurniture"), event: go("sell_multi") },
          { id: "both", label: msg("options.both"), event: set({ scope: "both" }) },
          { id: "dismantle", label: msg("options.withDismantling"), event: set({ scope: "move", dismantle: true }) },
        ],
      },
      actions: [],
    };
  }
  if (slots.from === undefined) return { message: msg("moving.from"), step: { kind: "place", slot: "from", initial: slots.hints?.from ?? null }, actions: [] };
  if (slots.to === undefined) return { message: msg("moving.to"), step: { kind: "place", slot: "to", initial: slots.hints?.to ?? null }, actions: [] };
  if (!slots.size) {
    return {
      message: msg("moving.size"),
      step: { kind: "choice", options: MOVE_SIZES.map((id) => ({ id, label: msg(`moveSizes.${id}`), event: set({ size: id }) })) },
      actions: [],
    };
  }
  if (slots.date === undefined) return { message: msg("moving.date"), step: { kind: "date" }, actions: [] };
  const actions: Action[] = [{ kind: "link", label: msg("actions.bookMoving"), href: movingHref(slots, ctx, "home"), primary: true }];
  if (slots.scope === "both") actions.push({ kind: "link", label: msg("actions.sellFurniture"), href: sellHref(slots, ctx) });
  return { message: msg(slots.scope === "both" ? "moving.readyBoth" : "moving.ready"), actions };
};

const OFFICE_SIZES = ["small", "medium", "large", "unsure"];

const office: Flow = ({ slots }, ctx) => {
  const sellOffice: Action = { kind: "link", label: msg("actions.sellOffice"), href: prefillHref(routes.sell, { category: "office-equipment" }) };
  if (!ctx.movingOn) return { message: msg("office.off"), actions: [sellOffice, ...whatsapp(ctx, true)] };
  if (!slots.size) {
    return {
      message: msg("office.ask"),
      step: { kind: "choice", options: OFFICE_SIZES.map((id) => ({ id, label: msg(`officeSizes.${id}`), event: set({ size: id }) })) },
      actions: [],
    };
  }
  return {
    message: msg("office.ready"),
    actions: [{ kind: "link", label: msg("actions.officeMove"), href: movingHref(slots, ctx, "office"), primary: true }, sellOffice],
  };
};

const technician: Flow = ({ slots }, ctx) => {
  if (!ctx.technicianOn) return comingSoon("technician.off", ctx);
  const subject = SUBJECTS.find((x) => x.id === slots.subject);
  if (!subject) {
    return {
      message: msg("technician.ask"),
      step: { kind: "choice", options: SUBJECTS.map((x) => ({ id: x.id, label: msg(`subjects.${x.id}`), event: set({ subject: x.id }) })) },
      actions: [],
    };
  }
  if (!slots.problem) {
    return {
      message: subject.job === "appliance" || subject.job === "ac" ? msg("technician.problemFor", { thing: ctx.t(`subjectsInline.${subject.id}`) }) : msg("technician.problem"),
      step: {
        kind: "choice",
        options: [...subject.problems, "other"].map((id) => ({ id, label: msg(`problems.${id}`), event: set({ problem: id }) })),
      },
      actions: [],
    };
  }
  const place = askHere(slots, msg("technician.where"));
  if (place) return place;
  const what = ctx.t(`subjects.${subject.id}`);
  const description = slots.problem === "other" ? what : ctx.t("prefill.job", { thing: what, problem: ctx.t(`problems.${slots.problem}`) });
  return {
    message: msg("technician.ready"),
    actions: [{ kind: "link", label: msg("actions.requestTechnician"), href: technicianHref(subject.job, description, slots, ctx), primary: true }],
  };
};

const handyman: Flow = ({ slots }, ctx) => {
  if (!ctx.technicianOn) return comingSoon("technician.off", ctx);
  const task = HANDYMAN_TASKS.find((x) => x.id === slots.task);
  if (!task) {
    return {
      message: msg("handyman.ask"),
      step: {
        kind: "choice",
        options: HANDYMAN_TASKS.map((x) => ({
          id: x.id,
          label: msg(`tasks.${x.id}`),
          event: x.flow ? go(x.flow) : set({ task: x.id }),
        })),
      },
      actions: [],
    };
  }
  const place = askHere(slots, msg("handyman.where"));
  if (place) return place;
  const description = ctx.t("prefill.task", { task: ctx.t(`tasks.${task.id}`) });
  return {
    message: msg("handyman.ready"),
    actions: [{ kind: "link", label: msg("actions.requestHandyman"), href: technicianHref(task.job ?? "repairs", description, slots, ctx), primary: true }],
  };
};

const dismantle: Flow = ({ slots }, ctx) => {
  if (slots.forMove === undefined) {
    return {
      message: msg(slots.item ? "dismantle.askItem" : "dismantle.ask", { item: slots.item ? inline(slots.item.label) : "" }),
      step: {
        kind: "choice",
        options: [
          { id: "only", label: msg("options.dismantleOnly"), event: set({ forMove: false }) },
          { id: "move", label: msg("options.dismantleAndMove"), event: go("moving", { scope: "move", dismantle: true, forMove: true }) },
        ],
      },
      actions: [],
    };
  }
  if (!ctx.technicianOn) return comingSoon("technician.off", ctx);
  const place = askHere(slots, msg("handyman.where"));
  if (place) return place;
  const description = ctx.t("prefill.dismantle", { item: slots.item?.label ?? ctx.t("prefill.furniture") });
  return {
    message: msg("dismantle.ready"),
    actions: [{ kind: "link", label: msg("actions.requestDismantling"), href: technicianHref("assembly", description, slots, ctx), primary: true }],
  };
};

const install: Flow = ({ slots }, ctx) => {
  if (!ctx.technicianOn) return comingSoon("technician.off", ctx);
  const what = INSTALL_THINGS.find((x) => x.id === slots.task);
  if (!what) {
    return {
      message: msg("install.ask"),
      step: { kind: "choice", options: INSTALL_THINGS.map((x) => ({ id: x.id, label: msg(`installThings.${x.id}`), event: set({ task: x.id }) })) },
      actions: [],
    };
  }
  const place = askHere(slots, msg("handyman.where"));
  if (place) return place;
  const description = ctx.t("prefill.install", { thing: ctx.t(`installThings.${what.id}`) });
  return {
    message: msg("install.ready"),
    actions: [{ kind: "link", label: msg("actions.requestInstallation"), href: technicianHref(what.job, description, slots, ctx), primary: true }],
  };
};

const assembly: Flow = ({ slots }, ctx) => {
  if (!ctx.technicianOn) return comingSoon("technician.off", ctx);
  if (!slots.task) {
    return {
      message: msg("assembly.ask"),
      step: { kind: "choice", options: ASSEMBLY_THINGS.map((id) => ({ id, label: msg(`assemblyThings.${id}`), event: set({ task: id }) })) },
      actions: [],
    };
  }
  const place = askHere(slots, msg("handyman.where"));
  if (place) return place;
  const description = ctx.t("prefill.assemble", { thing: ctx.t(`assemblyThings.${slots.task}`) });
  return {
    message: msg("assembly.ready"),
    actions: [{ kind: "link", label: msg("actions.requestAssembly"), href: technicianHref("assembly", description, slots, ctx), primary: true }],
  };
};

const clearance: Flow = ({ slots, answer }, ctx) => {
  const officeClear = answer?.category === "office";
  return {
    message: msg(officeClear ? "clearance.office" : "clearance.home"),
    actions: [
      { kind: "link", label: msg("actions.getOffer"), href: officeClear ? prefillHref(routes.sell, { category: "office-equipment" }) : sellHref(slots, ctx), primary: true },
      ...whatsapp(ctx),
      ...(officeClear ? [] : [{ kind: "link", label: msg("actions.movingOutGuide"), href: routes.sellMovingOut } as Action]),
    ],
  };
};

/** A mixed request ("moving out and selling my sofa"): one message and a direct action per need. */
const COMBO_MESSAGES: [IntentId[], string][] = [
  [["MOVING_HOME", "SELL_MULTIPLE"], "combo.moveSell"],
  [["MOVING_HOME", "SELL_ONE"], "combo.moveSell"],
  [["MOVING_HOME", "DISMANTLING"], "combo.moveDismantle"],
  [["MOVING_HOME", "ASSEMBLY"], "combo.moveDismantle"],
  [["ASSEMBLY", "DISMANTLING"], "combo.dismantleAssemble"],
];

function directAction(id: IntentId, s: Slots, all: IntentId[], ctx: FlowContext): Action | null {
  const moving = all.includes("MOVING_HOME") || all.includes("OFFICE_MOVING");
  switch (id) {
    case "BUY":
      return ctx.storeOn ? { kind: "link", label: msg("actions.browseStore"), href: s.item?.search ? `${routes.store}?q=${encodeURIComponent(s.item.search)}` : routes.store } : null;
    case "SELL_ONE":
    case "SELL_MULTIPLE":
    case "CLEARANCE":
      return { kind: "link", label: msg("actions.sellFurniture"), href: sellHref(s, ctx) };
    case "MOVING_HOME":
      return ctx.movingOn
        ? { kind: "link", label: msg("actions.bookMoving"), href: movingHref({ ...s, dismantle: all.includes("DISMANTLING") || all.includes("ASSEMBLY") }, ctx, "home") }
        : null;
    case "OFFICE_MOVING":
      return ctx.movingOn ? { kind: "link", label: msg("actions.officeMove"), href: movingHref(s, ctx, "office") } : null;
    case "TECHNICIAN": {
      if (!ctx.technicianOn) return null;
      const subject = SUBJECTS.find((x) => x.id === (s.item ? SUBJECT_BY_ITEM[s.item.key] : undefined));
      return { kind: "link", label: msg("actions.requestTechnician"), href: technicianHref(subject?.job ?? "appliance", ctx.query, s, ctx) };
    }
    default:
      // Handyman jobs; dismantling and assembly come with a move when there is one.
      if (!ctx.technicianOn || (moving && (id === "DISMANTLING" || id === "ASSEMBLY"))) return null;
      return { kind: "link", label: msg("actions.requestHandyman"), href: technicianHref(id === "INSTALLATION" ? "repairs" : "assembly", ctx.query, s, ctx) };
  }
}

const combo: Flow = ({ slots }, ctx) => {
  const ids = slots.intents ?? [];
  const key = COMBO_MESSAGES.find(([pair]) => pair.every((p) => ids.includes(p)))?.[1] ?? "combo.generic";
  const actions: Action[] = [];
  for (const id of ids) {
    // Each need with the things its own part of the request named ("sell my sofa" / "buy a fridge"), when the API split it.
    const own = slots.intentItems?.[id];
    const a = directAction(id, own ? { ...slots, item: own[0], things: own, picks: undefined } : slots, ids, ctx);
    if (a?.kind === "link" && actions.length < 3 && !actions.some((x) => x.kind === "link" && x.href === a.href)) {
      actions.push({ ...a, primary: !actions.length });
    }
  }
  return { message: msg(key), actions: actions.length ? actions : whatsapp(ctx, true) };
};

/** General starting points, offered when the request isn't clear. */
export const GENERAL_OPTIONS: Option[] = [
  { id: "buy", label: msg("general.buy"), event: go("buy") },
  { id: "sell", label: msg("general.sell"), event: go("sell_multi") },
  { id: "moving", label: msg("general.moving"), event: go("moving") },
  { id: "technician", label: msg("general.technician"), event: go("technician") },
  { id: "handyman", label: msg("general.handyman"), event: go("handyman") },
];

const CLARIFY_LABELS: Record<IntentId, string> = {
  BUY: "clarify.BUY",
  SELL_ONE: "clarify.SELL_ONE",
  SELL_MULTIPLE: "clarify.SELL_MULTIPLE",
  MOVING_HOME: "clarify.MOVING_HOME",
  OFFICE_MOVING: "clarify.OFFICE_MOVING",
  TECHNICIAN: "clarify.TECHNICIAN",
  HANDYMAN: "clarify.HANDYMAN",
  DISMANTLING: "clarify.DISMANTLING",
  INSTALLATION: "clarify.INSTALLATION",
  ASSEMBLY: "clarify.ASSEMBLY",
  CLEARANCE: "clarify.CLEARANCE",
};

/** "Did you mean…": the close candidates, with the matching store items when one of them is buying. */
const clarify: Flow = ({ answer }) => {
  const candidates = answer?.candidates ?? [];
  const item = answer?.entities.item;
  const products = answer?.products?.items.length ? answer.products : null;
  return {
    message: msg(products ? "clarify.withProducts" : item ? "clarify.item" : "clarify.ask", { item: item?.label ?? "" }),
    products,
    step: {
      kind: "choice",
      options: candidates.map((c) => ({ id: c.intent, label: msg(CLARIFY_LABELS[c.intent]), event: go(FLOW_BY_INTENT[c.intent]) })),
    },
    actions: [],
  };
};

const unknown: Flow = ({ answer }, ctx) => ({
  message: msg(answer?.flags.offensive ? "unknown.friendly" : answer?.flags.greeting ? "unknown.greeting" : "unknown.ask"),
  step: { kind: "choice", options: GENERAL_OPTIONS },
  actions: whatsapp(ctx),
});

const error: Flow = (_, ctx) => ({ message: msg("unknown.error"), step: { kind: "choice", options: GENERAL_OPTIONS }, actions: whatsapp(ctx) });

const FLOWS: Record<FlowId, Flow> = {
  buy,
  sell_one: sellOne,
  sell_multi: sellMulti,
  moving,
  office,
  technician,
  handyman,
  dismantle,
  install,
  assembly,
  clearance,
  combo,
  clarify,
  unknown,
  error,
};

export const FLOW_BY_INTENT: Record<IntentId, FlowId> = {
  BUY: "buy",
  SELL_ONE: "sell_one",
  SELL_MULTIPLE: "sell_multi",
  MOVING_HOME: "moving",
  OFFICE_MOVING: "office",
  TECHNICIAN: "technician",
  HANDYMAN: "handyman",
  DISMANTLING: "dismantle",
  INSTALLATION: "install",
  ASSEMBLY: "assembly",
  CLEARANCE: "clearance",
};

/** Intents a single flow already covers when they come together. */
function singleFlowFor(ids: IntentId[]): FlowId | null {
  const has = (id: IntentId) => ids.includes(id);
  if (has("OFFICE_MOVING") && ids.every((i) => ["OFFICE_MOVING", "DISMANTLING", "ASSEMBLY", "INSTALLATION"].includes(i))) return "office";
  if (has("CLEARANCE") && ids.every((i) => ["CLEARANCE", "SELL_ONE", "SELL_MULTIPLE"].includes(i))) return "clearance";
  if (has("ASSEMBLY") && has("INSTALLATION") && ids.length === 2) return "assembly";
  return null;
}

/** The flow and what is already known, from the API's answer. */
export function startFrom(answer: AssistantAnswer | null): { flow: FlowId; slots: Slots } {
  if (!answer) return { flow: "error", slots: {} };
  const e = answer.entities;
  const emirateOnly = (p: PlaceRef | null) => (p?.isEmirate ? placeFrom(p) : undefined);
  const slots: Slots = {
    item: e.item ? thing(e.item) : undefined,
    here: knownPlace(e.location),
    from: knownPlace(e.from),
    to: knownPlace(e.to),
    urgent: e.urgent || undefined,
    hints: { here: emirateOnly(e.location), from: emirateOnly(e.from), to: emirateOnly(e.to) },
  };
  // Pre-fill what the request already says, so those questions are skipped.
  if (e.item) {
    slots.subject = SUBJECT_BY_ITEM[e.item.key];
    if (answer.intent === "ASSEMBLY") slots.task = ASSEMBLY_BY_ITEM[e.item.key];
    else if (answer.intent === "INSTALLATION") slots.task = INSTALL_BY_ITEM[e.item.key];
    // "My sofa needs repair": the job is a repair.
    else if (answer.intent === "HANDYMAN") slots.task = "repairs";
  }
  if (e.problem) slots.problem = e.problem satisfies ProblemId;
  const groups = [...new Set(e.items.map(groupFor).filter((g): g is string => !!g))];
  if (groups.length) {
    slots.picks = groups;
    slots.picked = e.items.length > 1;
  }

  if (answer.intent === "UNKNOWN") return { flow: "unknown", slots };
  if (answer.ambiguous) return { flow: "clarify", slots };
  const ids = answer.intents.map((i) => i.intent);
  if (ids.length > 1) {
    const single = singleFlowFor(ids);
    const byKey = new Map(e.items.map((i) => [i.key, thing(i)]));
    const intentItems = Object.fromEntries(
      answer.intents.filter((s) => s.items).map((s) => [s.intent, s.items!.map((k) => byKey.get(k)).filter((x): x is Thing => !!x)]),
    ) as Partial<Record<IntentId, Thing[]>>;
    return single ? { flow: single, slots } : { flow: "combo", slots: { ...slots, intents: ids, intentItems } };
  }
  return { flow: FLOW_BY_INTENT[answer.intent], slots };
}

export function replyFor(flow: FlowId, state: FlowState, ctx: FlowContext): Reply {
  return FLOWS[flow](state, ctx);
}

// ---------- Starter pills ----------

export type Starter = {
  id: string;
  /** Opens a flow straight away (no API call), with these answers already known… */
  flow?: FlowId;
  slots?: Slots;
  /** …or asks the API, for answers that need the store (buying). */
  ask?: boolean;
  /** Only while this service is on. */
  needs?: "store";
};

/** The hero's pills, in rotation order. Each fills the box with its sentence (messages: starters.<id>). */
export const STARTERS: Starter[] = [
  { id: "movingOut", flow: "moving" },
  { id: "sellAll", flow: "sell_multi" },
  { id: "buy", ask: true, needs: "store" },
  { id: "sellOne", flow: "sell_one" },
  { id: "office", flow: "office" },
  { id: "technician", flow: "technician" },
  { id: "washingMachine", flow: "technician", slots: { subject: "washing_machine" } },
  { id: "handyman", flow: "handyman" },
];

/** How many starter pills show at once; the rest rotate in on other days. */
export const STARTERS_SHOWN = 6;
