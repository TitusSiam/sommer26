import { AMENITIES, SOURCES, STATUSES, DEFAULT_SETTINGS, type House, type Settings } from "./types";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown, min = 0, max = 10_000_000) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const coord = (v: unknown, lim: number) => {
  const n = num(v, -lim, lim);
  return n == null ? null : n;
};

export function cleanName(v: unknown): string {
  return str(v, 40);
}

export function cleanUrl(v: unknown): string {
  const s = str(v, 2000);
  if (!s) return "";
  if (s.startsWith("/api/images/")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Übernimmt nur bekannte Felder mit gültigen Werten. */
export function cleanHouse(input: Record<string, unknown>, base: House): House {
  const amenitiesIn = (input.amenities ?? {}) as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);
  const h: House = { ...base };
  if (has("name")) h.name = str(input.name, 120) || "Ohne Namen";
  if (has("url")) h.url = cleanUrl(input.url);
  if (has("source")) h.source = (SOURCES as readonly string[]).includes(input.source as string) ? (input.source as House["source"]) : "Sonstige";
  if (has("images") && Array.isArray(input.images)) h.images = input.images.map(cleanUrl).filter(Boolean).slice(0, 20);
  if (has("sleeps")) h.sleeps = num(input.sleeps, 1, 100);
  if (has("totalPrice")) h.totalPrice = num(input.totalPrice);
  if (has("pricePerDay")) h.pricePerDay = num(input.pricePerDay);
  if (has("pool")) h.pool = input.pool === true;
  if (has("seaDistance")) h.seaDistance = num(input.seaDistance, 0, 1_000_000);
  if (has("availableFrom")) h.availableFrom = date(input.availableFrom);
  if (has("availableTo")) h.availableTo = date(input.availableTo);
  if (has("amenities")) {
    h.amenities = { ...base.amenities };
    for (const a of AMENITIES) if (a in amenitiesIn) h.amenities[a] = amenitiesIn[a] === true;
  }
  if (has("cons")) h.cons = str(input.cons, 2000);
  if (has("status")) h.status = (STATUSES as readonly string[]).includes(input.status as string) ? (input.status as House["status"]) : base.status;
  if (has("proposedBy")) h.proposedBy = cleanName(input.proposedBy);
  if (has("location")) h.location = str(input.location, 200);
  if (has("lat")) h.lat = coord(input.lat, 90);
  if (has("lng")) h.lng = coord(input.lng, 180);
  return h;
}

export function cleanSettings(input: Record<string, unknown>): Settings {
  return {
    tripName: str(input.tripName, 80) || DEFAULT_SETTINGS.tripName,
    groupSize: num(input.groupSize, 1, 100),
    tripFrom: date(input.tripFrom),
    tripTo: date(input.tripTo),
  };
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
