import "server-only";

/** Geokodierung über OpenStreetMap Nominatim (max. 1 Anfrage/s, nur bei Bedarf). */
export async function geocode(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  if (!q.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ferienhaus-app/1.0 (private group trip planner)", "Accept-Language": "de" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name };
  } catch {
    return null;
  }
}
