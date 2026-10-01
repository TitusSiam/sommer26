import { NextResponse } from "next/server";
import { actorOf, bad, log, readJson } from "@/lib/api";
import { store } from "@/lib/store";
import { cleanHouse, newId } from "@/lib/sanitize";
import { geocode } from "@/lib/geocode";
import { emptyHouse, type House } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const now = Date.now();
  const base: House = { ...emptyHouse(), id: newId(), createdAt: now, updatedAt: now, proposedBy: actor };
  const house = cleanHouse((body.house ?? {}) as Record<string, unknown>, base);
  house.proposedBy ||= actor;
  if (!house.name || house.name === "Ohne Namen") {
    if (!house.url) return bad("Name oder Link angeben");
    house.name = house.name || "Ohne Namen";
  }
  if (house.location && (house.lat == null || house.lng == null)) {
    const g = await geocode(house.location);
    if (g) Object.assign(house, { lat: g.lat, lng: g.lng });
  }
  await store().saveHouse(house);
  await log({ type: "add", author: actor, houseId: house.id, houseName: house.name, detail: "" });
  return NextResponse.json({ house });
}
