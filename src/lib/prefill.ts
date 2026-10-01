/**
 * Hand-off from the hero assistant to the request forms: the assistant links to /sell, /moving or
 * /technician with what it already knows as URL parameters, and the form starts with those fields
 * filled in. They are only defaults the visitor can change; anything unexpected is dropped.
 */
import { UAE_EMIRATES } from "./ui";

type Value = string | number | boolean | string[] | null | undefined;

/** Locale-less link to a form page with its fields as parameters, scrolled to the form. */
export function prefillHref(path: string, values: Record<string, Value>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === "" || v === false || (Array.isArray(v) && !v.length)) continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : v === true ? "1" : String(v));
  }
  const q = qs.toString();
  return `${path}${q ? `?${q}` : ""}#request`;
}

const text = (p: URLSearchParams, key: string, max: number) => p.get(key)?.replace(/\s+/g, " ").trim().slice(0, max) || undefined;
const longText = (p: URLSearchParams, key: string, max: number) => p.get(key)?.trim().slice(0, max) || undefined;
const city = (p: URLSearchParams, key: string) => {
  const v = p.get(key);
  return v && UAE_EMIRATES.en.includes(v) ? v : undefined;
};
const day = (p: URLSearchParams, key: string) => {
  const v = p.get(key);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
};
const int = (p: URLSearchParams, key: string, min: number, max: number) => {
  const n = Number(p.get(key));
  return p.get(key) && Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};
const key = (p: URLSearchParams, name: string) => {
  const v = p.get(name);
  return v && /^[a-z0-9_-]{1,40}$/.test(v) ? v : undefined;
};

export type SellPrefill = { title?: string; description?: string; category?: string; city?: string; area?: string };

export const readSellPrefill = (p: URLSearchParams): SellPrefill => ({
  title: text(p, "title", 100),
  description: longText(p, "description", 3000),
  category: key(p, "category"),
  city: city(p, "city"),
  area: text(p, "area", 60),
});

export type MovingPrefill = {
  kind?: "home" | "office";
  fromCity?: string;
  fromArea?: string;
  toCity?: string;
  toArea?: string;
  moveDate?: string;
  rooms?: number;
  services?: string[];
  details?: string;
};

export const readMovingPrefill = (p: URLSearchParams): MovingPrefill => {
  const kind = p.get("kind");
  return {
    kind: kind === "home" || kind === "office" ? kind : undefined,
    fromCity: city(p, "fromCity"),
    fromArea: text(p, "fromArea", 60),
    toCity: city(p, "toCity"),
    toArea: text(p, "toArea", 60),
    moveDate: day(p, "moveDate"),
    rooms: int(p, "rooms", 0, 20),
    services: p.get("services")?.split(",").filter((s) => /^[a-z_]{1,40}$/.test(s)),
    details: longText(p, "details", 3000),
  };
};

export type TechnicianPrefill = { type?: string; description?: string; city?: string; area?: string; urgent?: boolean };

export const readTechnicianPrefill = (p: URLSearchParams): TechnicianPrefill => ({
  type: key(p, "type"),
  description: longText(p, "description", 2000),
  city: city(p, "city"),
  area: text(p, "area", 60),
  urgent: p.get("urgent") === "1",
});
