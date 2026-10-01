import "server-only";
import { NextResponse } from "next/server";
import { store } from "./store";
import { newId, cleanName } from "./sanitize";
import type { Activity, AppState } from "./types";

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function actorOf(body: Record<string, unknown>): string | null {
  return cleanName(body.actor) || null;
}

export async function log(a: Omit<Activity, "id" | "at">) {
  await store().addActivity({ ...a, id: newId(), at: Date.now() });
}

export async function fullState(): Promise<AppState> {
  const s = store();
  return { ...(await s.getState()), storage: s.kind, shareCode: process.env.GROUP_CODE || null };
}
