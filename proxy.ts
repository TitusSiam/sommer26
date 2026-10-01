import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

/**
 * Optionaler Zugangsschutz: Ist GROUP_CODE gesetzt, braucht jede Person den Code.
 * Links mit ?code=... (z. B. aus WhatsApp) setzen das Cookie automatisch.
 */
export async function proxy(req: NextRequest) {
  const code = process.env.GROUP_CODE;
  if (!code) return NextResponse.next();
  const token = await accessToken(code);
  const { pathname, searchParams } = req.nextUrl;

  if (searchParams.get("code") === code) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("code");
    const res = NextResponse.redirect(clean);
    res.cookies.set(ACCESS_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });
    return res;
  }

  if (req.cookies.get(ACCESS_COOKIE)?.value === token) return NextResponse.next();
  if (pathname === "/zugang" || pathname === "/api/login") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Kein Zugang" }, { status: 401 });
  const login = req.nextUrl.clone();
  login.pathname = "/zugang";
  login.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
