import { NextResponse } from "next/server";
import { fullState } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await fullState(), { headers: { "Cache-Control": "no-store" } });
}
