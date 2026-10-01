import { NextResponse } from "next/server";
import { actorOf, bad, log, readJson } from "@/lib/api";
import { store } from "@/lib/store";
import { cleanHouse } from "@/lib/sanitize";
import { geocode } from "@/lib/geocode";
import { describeChanges } from "@/lib/diff";
import { STATUS_LABEL } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const s = store();
  const old = await s.getHouse(id);
  if (!old) return bad("Haus nicht gefunden", 404);
  const patch = (body.house ?? {}) as Record<string, unknown>;
  const house = cleanHouse(patch, old);
  house.updatedAt = Date.now();
  const locationChanged = house.location !== old.location;
  const coordsGiven = "lat" in patch || "lng" in patch;
  if (house.location && locationChanged && !coordsGiven) {
    const g = await geocode(house.location);
    if (g) Object.assign(house, { lat: g.lat, lng: g.lng });
  }
  if (!house.location && locationChanged && !coordsGiven) Object.assign(house, { lat: null, lng: null });

  const changes = describeChanges(old, house);
  if (!changes && old.lat === house.lat && old.lng === house.lng) return NextResponse.json({ house: old });
  await s.saveHouse(house);
  const onlyStatus = old.status !== house.status && changes === `Status → ${STATUS_LABEL[house.status]}`;
  await log({
    type: onlyStatus ? "status" : "edit",
    author: actor,
    houseId: id,
    houseName: house.name,
    detail: onlyStatus ? STATUS_LABEL[house.status] : changes || "Standort",
  });
  return NextResponse.json({ house });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const actor = actorOf(await readJson(req));
  if (!actor) return bad("Name fehlt");
  const s = store();
  const old = await s.getHouse(id);
  if (!old) return bad("Haus nicht gefunden", 404);
  await s.deleteHouse(id);
  await log({ type: "delete", author: actor, houseId: null, houseName: old.name, detail: "" });
  return NextResponse.json({ ok: true });
}
