import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";
import { bad, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const expected = process.env.GROUP_CODE;
  if (!expected) return NextResponse.json({ ok: true });
  const { code } = await readJson(req);
  if (typeof code !== "string" || code.trim() !== expected) return bad("Falscher Code", 401);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, await accessToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return res;
}
