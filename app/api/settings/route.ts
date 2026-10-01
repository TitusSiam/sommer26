import { NextResponse } from "next/server";
import { actorOf, bad, log, readJson } from "@/lib/api";
import { store } from "@/lib/store";
import { cleanSettings } from "@/lib/sanitize";

export async function PUT(req: Request) {
  const body = await readJson(req);
  const actor = actorOf(body);
  if (!actor) return bad("Name fehlt");
  const settings = cleanSettings((body.settings ?? {}) as Record<string, unknown>);
  await store().saveSettings(settings);
  await log({ type: "settings", author: actor, houseId: null, houseName: null, detail: "Reisedaten" });
  return NextResponse.json({ settings });
}
