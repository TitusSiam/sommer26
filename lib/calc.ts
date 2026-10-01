import type { House, Settings, Source } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function nightsBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  return Math.round((b - a) / DAY);
}

/** Nächte für die Preisrechnung: Reisezeitraum der Gruppe, sonst Verfügbarkeit des Hauses. */
export function nightsFor(h: House, s: Settings): number | null {
  return nightsBetween(s.tripFrom, s.tripTo) ?? nightsBetween(h.availableFrom, h.availableTo);
}

export type Prices = {
  total: number | null;
  totalDerived: boolean;
  perDay: number | null;
  perDayDerived: boolean;
};

export function prices(h: House, s: Settings): Prices {
  const n = nightsFor(h, s);
  let total = h.totalPrice;
  let totalDerived = false;
  if (total == null && h.pricePerDay != null && n) {
    total = h.pricePerDay * n;
    totalDerived = true;
  }
  let perDay = h.pricePerDay;
  let perDayDerived = false;
  if (perDay == null && h.totalPrice != null && n) {
    perDay = h.totalPrice / n;
    perDayDerived = true;
  }
  return {
    total,
    totalDerived,
    perDay,
    perDayDerived,
  };
}

/** Deckt die Verfügbarkeit des Hauses den Reisezeitraum ab? null = nicht prüfbar */
export function coversTrip(h: House, s: Settings): boolean | null {
  if (!s.tripFrom || !s.tripTo || !h.availableFrom || !h.availableTo) return null;
  return h.availableFrom <= s.tripFrom && h.availableTo >= s.tripTo;
}

export function detectSource(url: string): Source {
  const u = url.toLowerCase();
  if (u.includes("airbnb.")) return "Airbnb";
  if (u.includes("booking.com")) return "Booking";
  if (u.includes("fewo-direkt.") || u.includes("fewodirekt")) return "FeWo-direkt";
  if (u.includes("vrbo.")) return "Vrbo";
  if (u.includes("holidu.")) return "Holidu";
  return "Sonstige";
}

/** Liest Koordinaten aus Google-Maps-Links oder „lat, lng“-Text. */
export function parseCoords(input: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /[?&](?:q|ll|query)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /^\s*(-?\d{1,2}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)\s*$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function euro(v: number | null | undefined): string {
  return v == null ? "–" : eur0.format(Math.round(v));
}

export function distance(m: number | null | undefined): string {
  if (m == null) return "–";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
}

export function dateShort(d: string | null): string {
  if (!d) return "";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function range(from: string | null, to: string | null): string {
  if (!from && !to) return "–";
  return `${dateShort(from) || "?"} – ${dateShort(to) || "?"}`;
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "gerade eben";
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? "gestern" : `vor ${d} Tagen`;
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

/** Parst deutsche und englische Zahlenschreibweise: „1.250,50“, „1250.5“, „1 250 €“. */
export function parseNumber(v: string): number | null {
  const s = v.replace(/[^\d.,-]/g, "");
  if (!s) return null;
  let norm = s;
  if (s.includes(",") && s.includes(".")) {
    norm = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    norm = /,\d{3}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/\.\d{3}$/.test(s) && s.split(".").length >= 2) {
    norm = s.replace(/\./g, "");
  }
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}
