import { NextResponse } from "next/server";
import { actorOf, bad, log, readJson } from "@/lib/api";
import { store } from "@/lib/store";
import { newId } from "@/lib/sanitize";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
  if (!text) return bad("Kommentar ist leer");
  const s = store();
  const house = await s.getHouse(id);
  if (!house) return bad("Haus nicht gefunden", 404);
  const comment = { id: newId(), houseId: id, author: actor, text, createdAt: Date.now() };
  await s.addComment(comment);
  const short = text.length > 80 ? `${text.slice(0, 77)}…` : text;
  await log({ type: "comment", author: actor, houseId: id, houseName: house.name, detail: short });
  return NextResponse.json({ comment });
}

/** Löscht einen eigenen Kommentar. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const s = store();
  const list = (await s.getState()).comments[id] ?? [];
  const target = list.find((c) => c.id === body.commentId);
  if (!target) return bad("Kommentar nicht gefunden", 404);
  if (target.author.toLowerCase() !== actor.toLowerCase()) return bad("Nur eigene Kommentare löschbar", 403);
  await s.deleteComment(id, target.id);
  return NextResponse.json({ ok: true });
}
