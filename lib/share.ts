import { euro, distance, prices } from "./calc";
import type { House, Settings } from "./types";

export function appUrl(path: string, shareCode: string | null): string {
  const u = new URL(path, window.location.origin);
  if (shareCode) u.searchParams.set("code", shareCode);
  return u.toString();
}

export function whatsappHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function houseShareText(h: House, s: Settings, votes: number, shareCode: string | null): string {
  const p = prices(h, s);
  const facts = [
    p.perPerson != null ? `${euro(p.perPerson)} p. P.` : null,
    p.total != null ? `${euro(p.total)} gesamt` : null,
    h.sleeps ? `${h.sleeps} Schlafplätze` : null,
    h.pool ? "Pool" : null,
    h.seaDistance != null ? `${distance(h.seaDistance)} zum Meer` : null,
  ].filter(Boolean);
  return [
    `🏡 ${h.name}`,
    facts.join(" · "),
    votes ? `👍 ${votes} ${votes === 1 ? "Stimme" : "Stimmen"}` : null,
    appUrl(`/haus/${h.id}`, shareCode),
  ]
    .filter(Boolean)
    .join("\n");
}
