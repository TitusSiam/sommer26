import { NextResponse } from "next/server";
import { bad } from "@/lib/api";
import { geocode } from "@/lib/geocode";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 200);
  if (!q.trim()) return bad("Ort fehlt");
  const g = await geocode(q);
  if (!g) return bad("Ort nicht gefunden", 404);
  return NextResponse.json(g);
}
