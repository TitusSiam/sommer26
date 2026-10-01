import { NextResponse } from "next/server";
import { bad } from "@/lib/api";
import { detectSource } from "@/lib/calc";

/** Einfacher Schutz gegen Anfragen ins interne Netz. */
function allowed(u: URL): boolean {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.port && u.port !== "443" && u.port !== "80") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":")) return false; // keine IP-Literale
  return h.includes(".");
}

function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2] ?? "") : null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return bad("Ungültiger Link");
  }
  if (!allowed(target)) return bad("Link nicht erlaubt");
  const source = detectSource(target.toString());

  let html = "";
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    if (res.ok && allowed(new URL(res.url))) html = (await res.text()).slice(0, 1_500_000);
  } catch {
    // Seite blockt oder ist langsam: dann nur Quelle zurückgeben
  }

  const title = meta(html, "og:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
  const description = meta(html, "og:description") ?? meta(html, "description");
  let image = meta(html, "og:image");
  if (image && image.startsWith("/")) image = new URL(image, target).toString();
  const text = `${title ?? ""} ${description ?? ""}`;
  const guests = text.match(/(\d{1,2})\s*(?:guests|gäste|personen|persons|people)/i);
  const coords =
    html.match(/"latitude"\s*:\s*(-?\d{1,2}\.\d+)\s*,\s*"longitude"\s*:\s*(-?\d{1,3}\.\d+)/) ??
    html.match(/"lat"\s*:\s*(-?\d{1,2}\.\d+)\s*,\s*"lng"\s*:\s*(-?\d{1,3}\.\d+)/);

  // Bewertungen, Zimmerzahlen und Portalnamen aus dem Titel entfernen
  const cleanTitle = title
    ? decode(title)
        .split(/\s·\s★|\s[-|–]\s(?:Airbnb|Booking\.com|FeWo-direkt|Vrbo|Holidu)\b/i)[0]
        .trim()
        .slice(0, 120)
    : null;

  return NextResponse.json({
    source,
    title: cleanTitle || null,
    image: image && /^https?:\/\//.test(image) ? image : null,
    sleeps: guests ? Number(guests[1]) : null,
    pool: /\bpool\b/i.test(text) || null,
    lat: coords ? Number(coords[1]) : null,
    lng: coords ? Number(coords[2]) : null,
  });
}
