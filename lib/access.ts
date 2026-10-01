export const ACCESS_COOKIE = "fh_access";

/** Cookie-Wert: SHA-256 des Gruppen-Codes, damit der Code nicht im Klartext im Cookie steht. */
export async function accessToken(code: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ferienhaus:${code}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
