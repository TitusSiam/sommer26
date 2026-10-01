import { AMENITY_LABEL, STATUS_LABEL, type House } from "./types";

const FIELD_LABEL: Partial<Record<keyof House, string>> = {
  name: "Name",
  url: "Link",
  source: "Quelle",
  images: "Bilder",
  sleeps: "Schlafplätze",
  totalPrice: "Gesamtpreis",
  pricePerDay: "Preis/Tag",
  pool: "Pool",
  seaDistance: "Entfernung zum Meer",
  availableFrom: "Zeitraum",
  availableTo: "Zeitraum",
  amenities: "Ausstattung",
  cons: "Nachteile",
  proposedBy: "Vorgeschlagen von",
  location: "Ort",
};

/** Kurze, lesbare Beschreibung der Änderungen für den Aktivitätsfeed. */
export function describeChanges(a: House, b: House): string {
  const out = new Set<string>();
  for (const k of Object.keys(FIELD_LABEL) as (keyof House)[]) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.add(FIELD_LABEL[k]!);
  }
  if (a.status !== b.status) out.add(`Status → ${STATUS_LABEL[b.status]}`);
  if (out.has("Ausstattung")) {
    const added = (Object.keys(b.amenities) as (keyof House["amenities"])[]).filter((k) => b.amenities[k] && !a.amenities[k]);
    if (added.length) {
      out.delete("Ausstattung");
      out.add(`+ ${added.map((k) => AMENITY_LABEL[k]).join(", ")}`);
    }
  }
  return [...out].join(", ");
}
