import { NextResponse } from "next/server";
import { actorOf, bad, log, readJson } from "@/lib/api";
import { store } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const s = store();
  const house = await s.getHouse(id);
  if (!house) return bad("Haus nicht gefunden", 404);
  const on = body.on === true;
  await s.setVote(id, actor, on);
  await log({ type: on ? "vote" : "unvote", author: actor, houseId: id, houseName: house.name, detail: "" });
  return NextResponse.json({ ok: true });
}
