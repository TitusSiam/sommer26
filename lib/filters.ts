import { coversTrip, prices } from "./calc";
import type { Amenity, House, Settings, Source, Status } from "./types";

export type Filters = {
  q: string;
  maxTotal: number | null;
  minSleeps: number | null;
  pool: boolean;
  maxSea: number | null; // Meter
  amenities: Amenity[];
  statuses: Status[];
  sources: Source[];
  proposers: string[];
  fitsTrip: boolean;
};

export const NO_FILTERS: Filters = {
  q: "",
  maxTotal: null,
  minSleeps: null,
  pool: false,
  maxSea: null,
  amenities: [],
  statuses: [],
  sources: [],
  proposers: [],
  fitsTrip: false,
};

export const SORTS = {
  votes: "Meiste Stimmen",
  "total-asc": "Gesamtpreis aufsteigend",
  "total-desc": "Gesamtpreis absteigend",
  "sleeps-desc": "Meiste Schlafplätze",
  "sea-asc": "Nächste am Meer",
  new: "Neueste zuerst",
} as const;
export type SortKey = keyof typeof SORTS;

export function activeFilterCount(f: Filters): number {
  return (
    (f.q.trim() ? 1 : 0) +
    (f.maxTotal != null ? 1 : 0) +
    (f.minSleeps != null ? 1 : 0) +
    (f.pool ? 1 : 0) +
    (f.maxSea != null ? 1 : 0) +
    f.amenities.length +
    f.statuses.length +
    f.sources.length +
    f.proposers.length +
    (f.fitsTrip ? 1 : 0)
  );
}

/** Aktive Filter erfüllen: Häuser ohne Angabe fallen bei aktivem Zahlenfilter raus (wie im Shop). */
export function matches(h: House, f: Filters, s: Settings): boolean {
  const p = prices(h, s);
  if (f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    if (![h.name, h.location, h.cons, h.proposedBy].some((x) => x.toLowerCase().includes(q))) return false;
  }
  if (f.maxTotal != null && (p.total == null || p.total > f.maxTotal)) return false;
  if (f.minSleeps != null && (h.sleeps == null || h.sleeps < f.minSleeps)) return false;
  if (f.pool && !h.pool) return false;
  if (f.maxSea != null && (h.seaDistance == null || h.seaDistance > f.maxSea)) return false;
  if (f.amenities.some((a) => !h.amenities[a])) return false;
  if (f.statuses.length && !f.statuses.includes(h.status)) return false;
  if (f.sources.length && !f.sources.includes(h.source)) return false;
  if (f.proposers.length && !f.proposers.includes(h.proposedBy)) return false;
  if (f.fitsTrip && coversTrip(h, s) !== true) return false;
  return true;
}

/** Unbekannte Werte landen bei jeder Sortierung hinten, „raus“ immer ganz unten. */
export function sortHouses(list: House[], key: SortKey, s: Settings, votes: (id: string) => number): House[] {
  const val = (h: House): number | null => {
    const p = prices(h, s);
    switch (key) {
      case "votes":
        return -votes(h.id);
      case "total-asc":
        return p.total;
      case "total-desc":
        return p.total == null ? null : -p.total;
      case "sleeps-desc":
        return h.sleeps == null ? null : -h.sleeps;
      case "sea-asc":
        return h.seaDistance;
      case "new":
        return -h.createdAt;
    }
  };
  return [...list].sort((a, b) => {
    const ra = a.status === "raus" ? 1 : 0;
    const rb = b.status === "raus" ? 1 : 0;
    if (ra !== rb) return ra - rb;
    const va = val(a);
    const vb = val(b);
    if (va == null && vb == null) return b.createdAt - a.createdAt;
    if (va == null) return 1;
    if (vb == null) return -1;
    return va - vb || b.createdAt - a.createdAt;
  });
}
